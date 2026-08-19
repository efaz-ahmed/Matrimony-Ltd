import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../index.html", import.meta.url);
const html = await readFile(pageUrl, "utf8");
const servicesMatch = html.match(
  /<section\b[^>]*\bid=["']services["'][^>]*>([\s\S]*?)<\/section>/i,
);

test("the Services section presents the complete Matrimonial Nikah offer", () => {
  assert.ok(servicesMatch, "Expected the page to contain a #services section");

  const section = servicesMatch[0];
  const visibleText = section
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  for (const expected of [
    "Matrimonial Nikah",
    "Aqd An-Nikah Service",
    "Available 7 Days a Week",
    "Start with Clarity",
    "Celebrate with Blessings",
    "Certified for Your Records",
    "Free Pre-Marriage Fiqh Course",
    "68 Kingsgate Rd, London NW6 4TE",
    "Up to 40 people",
  ]) {
    assert.match(visibleText, new RegExp(expected, "i"));
  }

  assert.match(section, /href=["']tel:\+447403947027["']/i);
  assert.match(section, /href=["']mailto:nikah@matrimonyltd\.com["']/i);
});

test("desktop and mobile navigation identify the Services destination as Islamic Marriage", () => {
  const desktopNav = html.match(/<ul\s+class=["']nav-links["'][^>]*>([\s\S]*?)<\/ul>/i);
  const mobileNav = html.match(/<aside\s+class=["']mobile-drawer["'][^>]*>([\s\S]*?)<\/aside>/i);

  assert.ok(desktopNav, "Expected the page to contain desktop navigation");
  assert.ok(mobileNav, "Expected the page to contain mobile navigation");

  for (const [name, navigation] of [
    ["desktop", desktopNav[0]],
    ["mobile", mobileNav[0]],
  ]) {
    const servicesLink = navigation.match(
      /<a\b[^>]*href=["']#services["'][^>]*>([\s\S]*?)<\/a>/i,
    );
    assert.ok(servicesLink, `Expected ${name} navigation to link to #services`);

    const accessibleName = servicesLink[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    assert.equal(accessibleName, "Islamic Marriage");
  }
});
