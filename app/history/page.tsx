import React from "react";
import ReadingHistoryClient from "./ReadingHistoryClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reading History - Your Recently Read Books",
  description:
    "View your reading history. Continue reading where you left off and track your reading progress across all your flipbooks.",
  keywords: [
    "reading history",
    "flipbook reader",
    "reading progress",
    "book tracker",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReadingHistoryPage() {
  return <ReadingHistoryClient />;
}
