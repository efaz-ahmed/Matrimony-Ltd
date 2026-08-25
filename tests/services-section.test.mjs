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

test("the flyer control opens the local high-resolution image in an accessible modal", () => {
  assert.ok(servicesMatch, "Expected the page to contain a #services section");

  const flyerLink = servicesMatch[0].match(
    /<a\b[^>]*class=["'][^"']*services-flyer-link[^"']*["'][^>]*>[\s\S]*?<\/a>/i,
  );
  assert.ok(flyerLink, "Expected a styled flyer link beneath the Services title");
  assert.match(flyerLink[0], /href=["']Matrimonial%20Nikah%20\(Matrimony%20Ltd\)\.jpg["']/i);
  assert.match(flyerLink[0], /aria-controls=["']nikah-flyer-dialog["']/i);
  assert.match(flyerLink[0], /aria-haspopup=["']dialog["']/i);
  assert.match(flyerLink[0], /Matrimonial Nikah \(Matrimony Ltd\) Flyer/i);
  assert.doesNotMatch(flyerLink[0], /target=["']_blank["']/i);

  const dialog = html.match(
    /<dialog\b[^>]*id=["']nikah-flyer-dialog["'][^>]*>[\s\S]*?<\/dialog>/i,
  );
  assert.ok(dialog, "Expected a flyer dialog in the delivered page");
  assert.match(dialog[0], /src=["']Matrimonial%20Nikah%20\(Matrimony%20Ltd\)\.jpg["']/i);
  assert.match(dialog[0], /data-flyer-zoom-in/i);
  assert.match(dialog[0], /data-flyer-zoom-out/i);
  assert.match(dialog[0], /data-flyer-close/i);
});
