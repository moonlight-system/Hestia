import {
    useEffect, useImperativeHandle, useLayoutEffect, useRef,
    type ReactNode, type Ref,
} from "react";

export type PagerHandle = { go: (dir: 1 | -1) => void };

type Props = {
    axis: "x" | "y";
    date: Date;
    step: (d: Date, n: number) => Date;   // how to move n pages from a date
    onChange: (d: Date) => void;          // called once a slide has finished
    render: (d: Date) => ReactNode;       // draws the page for a given date
    ref?: Ref<PagerHandle>;
};

const DURATION = 450;      // slide animation, in ms
const THRESHOLD = 30;      // wheel movement needed to count as a deliberate scroll
const GESTURE_GAP = 120;   // quiet time (ms) that separates one gesture from the next

function translate(axis: "x" | "y", percent: number){
    return axis === "y" ? `translateY(${percent}%)` : `translateX(${percent}%)`;
}

function PagedView({ axis, date, step, onChange, render, ref }: Props){
    const viewport = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLDivElement>(null);

    // The wheel listener lives for a long time, so it reads the latest props from here
    const latest = useRef({ date, step, onChange });
    latest.current = { date, step, onChange };

    const animating = useRef(false);
    const direction = useRef<1 | -1>(1);
    const fallback = useRef(0);

    // Slide to the neighbouring page; the real date only changes once the slide ends
    function go(dir: 1 | -1){
        const el = track.current;
        if (!el || animating.current) return;
        animating.current = true;
        direction.current = dir;
        el.style.transition = `transform ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
        el.style.transform = translate(axis, dir === 1 ? -200 : 0);
        // Safety net in case transitionend never fires (e.g. window hidden)
        fallback.current = window.setTimeout(finish, DURATION + 200);
    }

    function finish(){
        if (!animating.current) return;
        window.clearTimeout(fallback.current);
        const { date, step, onChange } = latest.current;
        onChange(step(date, direction.current));
    }

    useImperativeHandle(ref, () => ({ go }), [axis]);

    // After the date changes, snap the track back to the middle page with no animation.
    // The new middle page shows exactly what the sliding-in page showed, so nothing jumps.
    useLayoutEffect(() => {
        const el = track.current;
        if (!el) return;
        window.clearTimeout(fallback.current);
        el.style.transition = "none";
        el.style.transform = translate(axis, -100);
        void el.offsetHeight; // force a reflow so the next transition starts from here
        animating.current = false;
    }, [date, axis]);

    useEffect(() => {
        const el = viewport.current;
        if (!el) return;

        let acc = 0;
        let lastWheel = 0;
        let locked = false;

        function onWheel(e: WheelEvent){
            let delta: number;
            if (axis === "y") {
                delta = e.deltaY;
            } else {
                // Sideways pager: use whichever direction the user is scrolling more,
                // so a normal wheel, a vertical swipe and a horizontal swipe all work
                delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            }
            if (e.deltaMode === 1) delta *= 16; // some browsers report lines, not pixels
            e.preventDefault();

            // A pause in wheel events means a new gesture has started
            const now = performance.now();
            if (now - lastWheel > GESTURE_GAP) { acc = 0; locked = false; }
            lastWheel = now; // every event, even ignored ones, extends the current gesture

            if (locked || animating.current) return;

            acc += delta;
            if (Math.abs(acc) >= THRESHOLD) {
                const dir = acc > 0 ? 1 : -1;
                locked = true; // ignore the momentum tail until the user stops
                acc = 0;
                go(dir);
            }
        }

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [axis]);

    const pages = [-1, 0, 1].map((n) => ({ n, d: n === 0 ? date : step(date, n) }));

    return(
        <div className={`pager ${axis}`} ref={viewport}>
            <div
                className={`pager_track ${axis}`}
                ref={track}
                onTransitionEnd={(e) => {
                    // Buttons inside the pages have their own transitions, which bubble up
                    if (e.target === e.currentTarget && e.propertyName === "transform") finish();
                }}
            >
                {pages.map(({ n, d }) => (
                    // inert: the off-screen pages can't be clicked or tabbed into
                    <div className="pager_pane" key={n} inert={n !== 0}>
                        {render(d)}
                    </div>
                ))}
            </div>
        </div>
    )
}

export { PagedView }