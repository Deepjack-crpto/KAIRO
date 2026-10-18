import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { extractSubdomain } from "@/lib/tenant";
import SchoolNotFound from "@/pages/public/SchoolNotFound";
import { resolveTenantFromIp } from "@/services/ipTenantFallback";

describe("Production Subdomain Extraction (extractSubdomain)", () => {
  it("resolves school subdomain from standard production hostname", () => {
    expect(extractSubdomain("royal.kairo.com")).toBe("royal");
    expect(extractSubdomain("greenfield.kairo.com")).toBe("greenfield");
    expect(extractSubdomain("oxford.kairo.org")).toBe("oxford");
    expect(extractSubdomain("st-xaviers.kairo.in")).toBe("st-xaviers");
  });

  it("identifies main platform domain as null (kairo.com / www.kairo.com)", () => {
    expect(extractSubdomain("kairo.com")).toBeNull();
    expect(extractSubdomain("www.kairo.com")).toBeNull();
  });

  it("treats platform reserved prefixes as null (api, app, admin, console, status)", () => {
    expect(extractSubdomain("api.kairo.com")).toBeNull();
    expect(extractSubdomain("app.kairo.com")).toBeNull();
    expect(extractSubdomain("admin.kairo.com")).toBeNull();
    expect(extractSubdomain("console.kairo.com")).toBeNull();
    expect(extractSubdomain("status.kairo.com")).toBeNull();
  });

  it("handles localhost subdomains for local development (*.localhost)", () => {
    expect(extractSubdomain("royal.localhost")).toBe("royal");
    expect(extractSubdomain("oxford.localhost:5173")).toBe("oxford");
    expect(extractSubdomain("localhost:5173")).toBeNull();
  });

  it("does not treat pure IPv4 addresses as subdomains", () => {
    expect(extractSubdomain("192.168.1.100")).toBeNull();
    expect(extractSubdomain("10.0.0.1:3000")).toBeNull();
    expect(extractSubdomain("127.0.0.1")).toBeNull();
  });

  it("handles case-insensitivity and whitespace", () => {
    expect(extractSubdomain("   ROYAL.Kairo.Com:443  ")).toBe("royal");
  });
});

describe("IP-Based Routing Fallback (resolveTenantFromIp)", () => {
  it("returns null for null, undefined, or empty IP", async () => {
    expect(await resolveTenantFromIp(null)).toBeNull();
    expect(await resolveTenantFromIp(undefined)).toBeNull();
    expect(await resolveTenantFromIp("")).toBeNull();
  });

  it("returns null for local loopback IPs (does not guess)", async () => {
    expect(await resolveTenantFromIp("127.0.0.1")).toBeNull();
    expect(await resolveTenantFromIp("::1")).toBeNull();
  });

  it("returns null for unverified arbitrary IPs to ensure fallback to school selector", async () => {
    expect(await resolveTenantFromIp("203.0.113.42")).toBeNull();
  });
});

describe("SchoolNotFound Error Component", () => {
  it("renders the invalid subdomain and helpful resolution options", () => {
    const handleReset = vi.fn();
    render(<SchoolNotFound subdomain="unknown-academy" onReset={handleReset} />);

    expect(screen.getByText(/Unregistered School Domain/i)).toBeInTheDocument();
    expect(screen.getByText("unknown-academy.kairo.com")).toBeInTheDocument();
    expect(screen.getByText(/Go to KAIRO Main Platform & School Directory/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Platform Administration/i)).toBeInTheDocument();
  });

  it("triggers onReset when user clicks to return to main platform", () => {
    const handleReset = vi.fn();
    render(<SchoolNotFound subdomain="invalid-school" onReset={handleReset} />);

    const mainBtn = screen.getByText(/Go to KAIRO Main Platform & School Directory/i);
    fireEvent.click(mainBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
