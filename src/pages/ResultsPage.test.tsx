import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, MockInstance } from "vitest";
import axios from "axios";
import ResultsPage from "./ResultsPage";

// Properly mock axios
vi.mock("axios");

describe("ResultsPage", () => {
  beforeEach(() => {
    // Correct way to reset the mock in Vitest
    vi.clearAllMocks();
  });

  it("renders summary values and cleared backlog state from backend response", async () => {
    // Type casting axios.get as a Vitest Mock to solve the 'unknown' property errors
    (axios.get as any).mockResolvedValue({
      data: {
        student: {
          name: "Jane Doe",
          branch: "CSE",
          college: "Malla Reddy College of Engineering",
          regulation: "R18",
        },
        summary: {
          cgpa: "8.12",
          activeBacklogCount: 0,
          clearedBacklogCount: 1,
          semesterCount: 1,
        },
        warnings: ["No result rows were found for 4-2."],
        semesters: [
          {
            semester: "2-1",
            regulation: "R18",
            examCodesTried: ["1667", "1671"],
            attemptsFetched: 2,
            sgpa: "8.12",
            hasActiveBacklog: false,
            subjects: [
              {
                code: "CS401",
                name: "Compiler Design",
                internal: 20,
                external: 38,
                total: 58,
                grade: "B",
                credits: "3",
                status: "cleared_backlog",
                clearedFromGrade: "F",
                latestExamCode: "1671",
              },
            ],
          },
        ],
      },
    });

    render(<ResultsPage />);

    const input = screen.getByPlaceholderText(/Enter Roll Number/i);
    fireEvent.change(input, { target: { value: "22Q91A6665" } });
    
    const button = screen.getByRole("button", { name: /Get Results/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/ACADEMIC RESULTS/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verifications
    expect(screen.getAllByText("8.12")).toHaveLength(2);
    expect(screen.getByText(/Cleared/i)).toBeInTheDocument();
    expect(screen.getByText(/Cleared from F via exam code 1671/i)).toBeInTheDocument();
    expect(screen.getByText(/No result rows were found for 4-2/i)).toBeInTheDocument();
  });
});