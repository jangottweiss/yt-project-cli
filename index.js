#!/usr/bin/env node
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import { promises as fsPromises } from "fs";
import slugify from "@sindresorhus/slugify";
import { createSpinner } from "nanospinner";
import { input, confirm } from "@inquirer/prompts";
import checkbox, { Separator } from "@inquirer/checkbox";
import chalk from "chalk";

// CONFIG
const configFile = "config.json";
const cwd = process.cwd();
const moduleURL = import.meta.url;
const moduleDir = dirname(fileURLToPath(moduleURL));
const utilFilePath = join(moduleDir, configFile);
const fileList = await fsPromises.readdir(cwd);
const config = JSON.parse(await fsPromises.readFile(utilFilePath));

function pad(num, pad = 2) {
  return String(num).padStart(pad, "0");
}

/*
 * CLI QUESTIONS
 */

const projectName = await input({
  message: "Enter Project Name:",
});
const projectNameSlug = slugify(projectName || "changeme");

for (let index = 0; index < config.folders.length; index++) {
  const element = config.folders[index];
  if (!element.subfolders) continue;
  const subfolders = element.subfolders;
  element.selected = await checkbox({
    message: element.question,
    choices: subfolders.map((e) => ({
      name: e.name,
      value: slugify(e.name),
      checked: e.default ?? false,
    })),
  });
}

/*
 * CREATING FOLDERS
 */
const spinner = createSpinner("Creating Folders").start();

// Create Project Folder

const currentProjects = fileList
  .map((e) => e.split("-")?.[0])
  .map((e) => parseInt(e))
  .filter((e) => e && Number.isInteger(e));

const newProjectNumber = Math.max(...currentProjects) + 1;
const projectFolderName = `${pad(newProjectNumber)}-${projectNameSlug}`;
await fsPromises.mkdir(join(cwd, projectFolderName));

for (let index = 0; index < config.folders.length; index++) {
  const element = config.folders[index];
  const folderName = `${pad(index + 1)}-${slugify(element.name)}`;
  await fsPromises.mkdir(join(cwd, projectFolderName, folderName));
  
  if (!element.subfolders) continue;
  
  for (let si = 0; si < element.selected.length; si++) {
    const subfolders = element.selected[si];
    const subfolderName = `${pad(si + 1)}-${subfolders}`;
    await fsPromises.mkdir(
      join(cwd, projectFolderName, folderName, subfolderName)
    );
  }
}

spinner.success();
