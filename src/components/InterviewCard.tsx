import Image from "next/image";
import Link from "next/link";
import { interviewCovers } from "@constants";
import { Button } from "@/components/ui/button";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const InterviewCard = ({
  interviewId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  console.log("[InterviewCard] props:", { interviewId, role, type, techstack, createdAt });
  const coverIndex = interviewId
    ? hashString(interviewId) % interviewCovers.length
    : 0;
  const cover = interviewCovers[coverIndex];

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-2xl ring-1 ring-white/[0.07] w-full">
      <div className="bg-linear-to-b from-[#141519] to-[#0b0c12] rounded-2xl min-h-full flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="relative size-14 shrink-0">
            <Image
              src={cover}
              alt={role}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-semibold text-base leading-snug">{role}</h3>
            <span className="text-indigo-300/50 text-sm">{type}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(techstack ?? []).slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="bg-white/5 text-indigo-300/60 rounded-md px-2 py-0.5 text-xs ring-1 ring-white/8"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {formattedDate && (
            <span className="text-indigo-300/40 text-xs">{formattedDate}</span>
          )}
          <Button
            asChild
            className="ml-auto bg-violet-500/15! text-violet-300! hover:bg-violet-500/25! ring-1! ring-violet-500/30! rounded-full! text-sm! font-semibold! px-4! h-8! cursor-pointer transition-colors!"
          >
            <Link href={`/interview/${interviewId}`}>Inizia</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
