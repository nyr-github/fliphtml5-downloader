"use client";

import { AnimatePresence } from "motion/react";
import type { DownloadTask } from "@/lib/tasks";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: DownloadTask[];
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onStartDownload: (url: string, id: string) => void;
}

export default function TaskList({ tasks, ...actions }: TaskListProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {tasks.map((task) => <TaskCard key={task.id} task={task} {...actions} />)}
      </AnimatePresence>
    </div>
  );
}
