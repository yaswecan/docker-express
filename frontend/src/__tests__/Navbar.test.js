import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../components/Navbar.jsx";

const mockUser = { username: "testuser", email: "test@example.com" };
const mockOnLogout = jest.fn();

describe("Navbar", () => {
  test("renders without user", () => {
    render(<Navbar user={null} onLogout={mockOnLogout} />);

    expect(
      screen.getByText("🚀 React + Socket.IO + Express + MySQL"),
    ).toBeInTheDocument();
    expect(screen.queryByText("testuser")).not.toBeInTheDocument();
  });

  test("renders with user info", () => {
    render(<Navbar user={mockUser} onLogout={mockOnLogout} />);

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Déconnexion")).toBeInTheDocument();
  });

  test("handles logout click", () => {
    render(<Navbar user={mockUser} onLogout={mockOnLogout} />);

    const logoutButton = screen.getByText("Déconnexion");
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalled();
  });
});
