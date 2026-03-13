import type { Metadata } from "next";
import ProctorClient from "./ProctorClient";

export const metadata: Metadata = {
  title: "Proctor — Interview Monitor",
  description: "Real-time interview proctoring with gaze and behaviour detection.",
};

export default function ProctorPage() {
  return <ProctorClient />;
}
