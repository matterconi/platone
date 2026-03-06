"use client";

import { useState, KeyboardEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { interviewFormSchema } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SelectField from "./SelectField";

interface Props {
  onSubmit: (data: InterviewFormValues) => void;
}

const InterviewSetupForm = ({ onSubmit }: Props) => {
  const [tagInput, setTagInput] = useState("");

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      role: "",
      techstack: [],
    },
  });

  const tags = useWatch({ control: form.control, name: "techstack" }) ?? [];

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
        form.setValue("techstack", [...tags, trimmed]);
        setTagInput("");
      }
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    form.setValue("techstack", tags.filter((t) => t !== tag));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full">
  
        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-indigo-100! font-normal!">Ruolo target</FormLabel>
              <FormControl>
                <Input className="bg-zinc-800! rounded-full! min-h-12! px-5! placeholder:text-indigo-100!" placeholder="es. Frontend Developer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
  
        {/* Level + Type */}
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            control={form.control}
            name="level"
            label="Seniority"
            placeholder="Seleziona livello"
            options={[
              { value: "junior", label: "Junior" },
              { value: "mid", label: "Mid" },
              { value: "senior", label: "Senior" },
            ]}
          />
          <SelectField
            control={form.control}
            name="type"
            label="Tipo di interview"
            placeholder="Seleziona tipo"
            options={[
              { value: "technical", label: "Technical" },
              { value: "behavioral", label: "Behavioral" },
              { value: "mixed", label: "Mixed" },
            ]}
          />
        </div>
  
        {/* Techstack tag input */}
        <FormField
          control={form.control}
          name="techstack"
          render={() => (
            <FormItem>
              <FormLabel className="text-indigo-100! font-normal!">Tech Stack (max 5, premi Invio)</FormLabel>
              <FormControl>
                <Input
                  className="input"
                  placeholder="es. React"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={tags.length >= 5}
                />
              </FormControl>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-slate-900 text-indigo-400 text-xs px-3 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-indigo-600 hover:text-indigo-100 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
  
        {/* Specialization */}
        <SelectField
          control={form.control}
          name="specialization"
          label="Specializzazione (opzionale)"
          placeholder="Nessuna"
          options={[
            { value: "general", label: "General" },
            { value: "animations", label: "Animations" },
            { value: "blockchain", label: "Blockchain" },
            { value: "devops", label: "DevOps" },
            { value: "accessibility", label: "Accessibility" },
          ]}
        />
  
        <Button type="submit" className="bg-violet-300! text-zinc-950! hover:bg-violet-300/80! rounded-full! font-bold! px-5 cursor-pointer min-h-10 w-full mt-2">
          Conferma
        </Button>
  
      </form>
    </Form>
  );
  
};

export default InterviewSetupForm;
