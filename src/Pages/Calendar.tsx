import "./Calendar.css";
import { Event } from "../Types";

function Calendar(){

    const events: Event[] = [
        {
            id: "1",
            name: "Event test",
            start: new Date("2026-10-22T14:00:00"),
            person: [{ id: "p1", name: "Mello" }, { id: "p2", name: "Lin" }],
        },
    ]

    return(
        <div className="calendar_container">
            <div>Calendar !</div>
            {events.map((e) =>
                <div key={e.id}>
                    <div>{e.name}</div>
                    <div>{e.start.toLocaleString()}</div>
                    <div>{e.person?.map((p) => p.name).join(", ")}</div>
                </div>
            )}
        </div>
        
    )
}

export { Calendar }