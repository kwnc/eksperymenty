# Project: Master's Thesis on Multi-Agent Systems

## Directory Overview

This directory contains the LaTeX source code for a Master's Thesis titled "Experiments with multi-agent systems for creating business applications" (`Eksperymenty z systemami wieloagentowymi do tworzenia aplikacji biznesowych`).

The core of this repository is the thesis itself, which investigates the use of AI agents in software development. It includes theoretical chapters, descriptions of experiments, and the results of those experiments.

A significant part of the project is a practical implementation of a web application named "AutoServe," which was developed as part of the thesis research. This sub-project is located in the `portal-dla-serwisu-samochodowego/` directory.

## Key Files and Directories

*   `main.tex`: The main LaTeX file for compiling the entire thesis. It defines the document structure and includes all the chapter files.
*   `tex/`: This directory contains the individual chapters of the thesis as separate `.tex` files.
*   `bibliografia.bib`: The BibTeX file containing all the bibliographic references for the thesis.
*   `img/`: Contains images and diagrams used in the thesis.
*   `portal-dla-serwisu-samochodowego/`: A self-contained web application project that serves as a practical experiment for the thesis.

## Thesis Usage

To compile the thesis, a standard LaTeX distribution (like TeX Live, MiKTeX) is required. The main file to be compiled is `main.tex`. The compilation process should be run with a tool that supports `biber` for bibliography processing.

## Sub-Project: AutoServe Web Application

The `portal-dla-serwisu-samochodowego/` directory contains the "AutoServe" application, a portal for managing a car service workshop.

### Technology Stack

*   **Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand
*   **Database:** Dexie.js (a wrapper for IndexedDB, implementing a local-first architecture)
*   **Testing:** Vitest

### Building and Running the Sub-Project

The following commands are available from within the `portal-dla-serwisu-samochodowego/` directory:

*   **Install dependencies:**
    ```bash
    npm install
    ```
*   **Run the development server:**
    ```bash
    npm run dev
    ```
*   **Build for production:**
    ```bash
    npm run build
    ```
*   **Run tests:**
    ```bash
    npm run test
    ```
*   **Lint the code:**
    ```bash
    npm run lint
    ```
