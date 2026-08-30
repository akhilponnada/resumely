import { jobDescriptionBlocks } from "@/lib/jobDescription";

export function JobDescription({ text }: { text: string }) {
    const blocks = jobDescriptionBlocks(text);
    if (blocks.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                See the company posting for the full description.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3 text-[15px] leading-7 text-foreground/90">
            {blocks.map((block, i) => {
                if (block.type === "h") {
                    return (
                        <h4
                            key={i}
                            className="mt-2 font-heading text-base font-medium tracking-tight first:mt-0"
                        >
                            {block.text}
                        </h4>
                    );
                }
                if (block.type === "ul") {
                    return (
                        <ul key={i} className="flex flex-col gap-1.5 pl-5">
                            {block.items.map((item, j) => (
                                <li key={j} className="list-disc">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    );
                }
                return <p key={i}>{block.text}</p>;
            })}
        </div>
    );
}
