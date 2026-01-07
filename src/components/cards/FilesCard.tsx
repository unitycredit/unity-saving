"use client";

import * as React from "react";

import { FileManager } from "@/components/files/FileManager";

export function FilesCard() {
  // Dashboard view: compact mode keeps the card tight and “executive” looking.
  return <FileManager compact />;
}


