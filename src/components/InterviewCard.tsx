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
    <div className="card-border w-full">
      <div className="card flex flex-col gap-4 p-6">
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
            <h3 className="text-light-100 font-semibold">{role}</h3>
            <span className="text-light-400 text-sm">{type}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(techstack ?? []).slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="bg-dark-300 text-light-400 rounded px-2 py-0.5 text-xs"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {formattedDate && (
            <span className="text-light-400 text-xs">{formattedDate}</span>
          )}
          <Button asChild className="btn ml-auto">
            <Link href={`/interview/${interviewId}`}>Inizia</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
