import "./Tasks.css";
import { useState } from "react";
import {
    addDoc, arrayRemove, arrayUnion, collection, deleteDoc, deleteField,
    doc, Timestamp, updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useTasks } from "../useTasks";
import { TaskModal, type TaskData, type TaskModalMode } from "./TaskModal";
import { ContextMenu } from "./ContextMenu";
import { HISTORY_LIMIT, dueOf, isComplete, nextDueOf, repeatLabel } from "../taskUtils";
import type { Person, Task } from "../Types";

type ModalState = { mode: TaskModalMode; id?: string; initial: TaskData };
type MenuState = { x: number; y: number; task: Task };

type CardProps = {
    task: Task;
    members: Person[];
    me: string;
    today: Date;
    onToggle: (task: Task, personId: string) => void;
    onContext: (task: Task, x: number, y: number) => void;
};

function TaskCard({ task, members, me, today, onToggle, onContext }: CardProps){
    const complete = isComplete(task);
    const finished = complete && !task.repeat;
    const due = dueOf(task);
    const next = task.repeat && complete ? nextDueOf(task) : undefined;
    const overdue = !!due && !complete && due < today;

    // Names are looked up live, so a renamed roommate shows their new name
    const nameOf = (p: Person) => members.find((m) => m.id === p.id)?.name ?? p.name;
    const fmt = (d: Date) => d.toLocaleDateString([], { day: "numeric", month: "short" });

    type Box = { id: string; label?: string; checked: boolean; enabled: boolean };
    const boxes: Box[] =
        task.mode === "each"
            ? task.participants.map((p) => ({
                id: p.id,
                label: nameOf(p),
                checked: task.done.includes(p.id),
                enabled: p.id === me,
            }))
        : task.mode === "assigned" && task.assignee
            ? [{
                id: task.assignee.id,
                checked: task.done.includes(task.assignee.id),
                enabled: task.assignee.id === me,
            }]
        : [{ id: me, checked: task.done.length > 0, enabled: true }];

    const parts: { text: string; bad?: boolean }[] = [];
    if (next) parts.push({ text: `Next ${fmt(next)}` });
    else if (due) parts.push({
        text: overdue ? `Overdue since ${fmt(due)}` : `Due ${fmt(due)}`,
        bad: overdue,
    });
    if (task.repeat) parts.push({ text: repeatLabel(task.repeat) });
    if (task.mode === "assigned" && task.assignee) {
        parts.push({ text: `Assigned to ${nameOf(task.assignee)}` });
    }
    if (task.mode === "anyone" && task.done[0]) {
        const who = members.find((m) => m.id === task.done[0])?.name;
        if (who) parts.push({ text: `Done by ${who}` });
    }

    return(
        <div
            className={finished ? "task_card finished" : "task_card"}
            onContextMenu={(e) => {
                e.preventDefault();
                onContext(task, e.clientX, e.clientY);
            }}
        >
            <div className="task_main">
                <div className="task_name">{task.name}</div>
                {parts.length > 0 && (
                    <div className="task_meta">
                        {parts.map((p, i) => (
                            <span key={i} className={p.bad ? "task_overdue" : undefined}>
                                {i > 0 && " · "}{p.text}
                            </span>
                        ))}
                    </div>
                )}
                {task.description && <div className="task_desc">{task.description}</div>}
            </div>

            <div className="task_boxes">
                {boxes.map((b) => (
                    <label key={b.id} className="task_box">
                        <input
                            type="checkbox"
                            checked={b.checked}
                            disabled={!b.enabled}
                            onChange={() => onToggle(task, b.id)}
                        />
                        {b.label && <span>{b.label}</span>}
                    </label>
                ))}
            </div>
        </div>
    )
}

function Tasks(){
    const hid = useHouseholdId();
    const members = useMembers();
    const { tasks, today } = useTasks();
    const me = auth.currentUser!.uid;

    const [modal, setModal] = useState<ModalState | null>(null);
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const col = collection(db, "households", hid, "tasks");

    function openCreate(){
        setModal({
            mode: "create",
            initial: {
                name: "",
                mode: "anyone",
                participants: members.map(({ id, name }) => ({ id, name })),
            },
        });
    }

    function openEdit(task: Task, mode: TaskModalMode = "edit"){
        setModal({
            mode,
            id: task.id,
            initial: {
                name: task.name,
                mode: task.mode,
                assignee: task.assignee,
                participants: task.participants,
                repeat: task.repeat,
                date: task.date,
                description: task.description,
            },
        });
    }

    async function save(data: TaskData){
        if (!modal) return;
        const name = data.name.trim();

        if (modal.id && modal.mode === "rename") {
            await updateDoc(doc(col, modal.id), { name });
            setModal(null);
            return;
        }

        const fields: Record<string, unknown> = { name, mode: data.mode, cycle: 0, done: [] };
        // Firestore rejects `undefined`, so optional fields are either written
        // or (when editing) removed
        const optional: Record<string, unknown> = {
            assignee: data.assignee,
            participants: data.mode === "each" ? data.participants : undefined,
            repeat: data.repeat,
            date: data.date ? Timestamp.fromDate(data.date) : undefined,
            description: data.description,
        };
        for (const [key, value] of Object.entries(optional)) {
            if (value !== undefined) fields[key] = value;
            else if (modal.id) fields[key] = deleteField();
        }

        if (modal.id) {
            // Editing restarts the task's progress
            fields.completedAt = deleteField();
            await updateDoc(doc(col, modal.id), fields);
        } else {
            fields.createdAt = Timestamp.now();
            await addDoc(col, fields);
        }
        setModal(null);
    }

    async function toggle(task: Task, personId: string){
        const had = task.done.includes(personId);
        // "Anyone" tasks hold one tick; the others hold one tick per person
        const after = task.mode === "anyone"
            ? (task.done.length > 0 ? [] : [personId])
            : had ? task.done.filter((x) => x !== personId) : [...task.done, personId];

        const patch: Record<string, unknown> = {
            // arrayUnion/arrayRemove keep simultaneous ticks from overwriting each other
            done: task.mode === "anyone" ? after : had ? arrayRemove(personId) : arrayUnion(personId),
        };
        if (!task.repeat) {
            patch.completedAt = isComplete({ ...task, done: after }) ? Timestamp.now() : deleteField();
        }
        try {
            await updateDoc(doc(col, task.id), patch);
        } catch (err) {
            console.error(err);
        }
    }

    async function remove(task: Task){
        await deleteDoc(doc(col, task.id));
    }

    const active = tasks
        .filter((t) => t.repeat || !isComplete(t))
        .sort((a, b) => {
            const x = dueOf(a), y = dueOf(b);
            if (x && y) return x.getTime() - y.getTime();
            if (x) return -1;
            if (y) return 1;
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

    const finished = tasks
        .filter((t) => !t.repeat && isComplete(t))
        .sort((a, b) =>
            (b.completedAt ?? b.createdAt).getTime() - (a.completedAt ?? a.createdAt).getTime())
        .slice(0, HISTORY_LIMIT);

    const card = (t: Task) => (
        <TaskCard
            key={t.id}
            task={t}
            members={members}
            me={me}
            today={today}
            onToggle={toggle}
            onContext={(task, x, y) => setMenu({ x, y, task })}
        />
    );

    return(
        <div className="tasks_container">
            <div className="tasks_toolbar">
                <h2 className="tasks_title">Tasks</h2>
                <button className="tasks_new" onClick={openCreate}>+ New task</button>
            </div>

            <div className="tasks_list">
                {active.length === 0 && <div className="tasks_empty">Nothing to do. Enjoy it!</div>}
                {active.map(card)}
            </div>

            {finished.length > 0 && (
                <div className="tasks_list">
                    <button className="task_history_toggle" onClick={() => setShowHistory((s) => !s)}>
                        {showHistory ? "▾" : "▸"} Completed ({finished.length})
                    </button>
                    {showHistory && finished.map(card)}
                </div>
            )}

            {modal && (
                <TaskModal
                    mode={modal.mode}
                    initial={modal.initial}
                    members={members}
                    onSave={save}
                    onClose={() => setModal(null)}
                />
            )}

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                    onEdit={() => openEdit(menu.task)}
                    onRename={() => openEdit(menu.task, "rename")}
                    onDelete={() => remove(menu.task)}
                />
            )}
        </div>
    )
}

export { Tasks }