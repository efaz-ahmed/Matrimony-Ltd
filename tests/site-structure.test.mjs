import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../index.html", import.meta.url);
const html = await readFile(pageUrl, "utf8");

function stripMarkup(fragment) {
  return fragment
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionById(id) {
  return html.match(
    new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/section>`, "i"),
  )?.[0];
}

function navigationLinks(fragment) {
  return [...fragment.matchAll(/<a\b[^>]*href=["'](#[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, href, label]) => ({ href, label: stripMarkup(label) }));
}

test("desktop and mobile menus expose the approved section order", () => {
  const expected = [
    { href: "#about", label: "About" },
    { href: "#manor", label: "Matrimony Manor" },
    { href: "#services", label: "Complimentary Services" },
    { href: "#future-ventures", label: "Future Ventures" },
    { href: "#investor", label: "Investors" },
    { href: "#team", label: "Team" },
    { href: "#faq", label: "FAQs" },
    { href: "#contact", label: "Contact" },
  ];
  const desktop = html.match(/<ul\s+class=["']nav-links["'][^>]*>[\s\S]*?<\/ul>/i)?.[0];
  const mobile = html.match(/<aside\s+class=["']mobile-drawer["'][^>]*>[\s\S]*?<\/aside>/i)?.[0];

  assert.ok(desktop, "Expected desktop navigation");
  assert.ok(mobile, "Expected mobile navigation");
  assert.deepEqual(navigationLinks(desktop), expected);
  assert.deepEqual(navigationLinks(mobile), expected);
});

test("menu-linked sections clear the fixed navigation when opened", () => {
  assert.match(
    html,
    /section\[id\]\s*\{[^}]*scroll-margin-top:\s*(?:8[4-9]|9\d)px/i,
    "Expected anchored sections to clear the fixed header",
  );
});

test("the unchanged hero remains before an About section that explains the company history", () => {
  const heroIndex = html.search(/<section\s+class=["'][^"']*hero[^"']*["']/i);
  const aboutIndex = html.search(/<section\b[^>]*\bid=["']about["']/i);
  const about = sectionById("about");

  assert.ok(heroIndex >= 0, "Expected the existing hero section");
  assert.ok(aboutIndex > heroIndex, "Expected About to begin after the hero");
  assert.ok(about, "Expected an About section");
  const aboutText = stripMarkup(about);
  assert.match(aboutText, /New Vision Housing/i);
  assert.match(aboutText, /separate company/i);
  assert.match(aboutText, /halal ventures/i);
});

test("Complimentary Services presents all four approved offers", () => {
  const services = sectionById("services");
  assert.ok(services, "Expected a Complimentary Services section");
  const servicesText = stripMarkup(services);

  for (const service of [
    "Islamic Marriage Service (Aqd An-Nikah)",
    "Pre-Marriage Fiqh Course",
    "Chauffeur Service",
    "Cake Service",
  ]) {
    assert.match(servicesText, new RegExp(service.replace(/[()]/g, "\\$&"), "i"));
  }
});

test("Future Ventures contains only the three planned ventures", () => {
  const ventures = sectionById("future-ventures");
  assert.ok(ventures, "Expected a Future Ventures section");
  const venturesText = stripMarkup(ventures);

  for (const venture of ["Care Home", "Franchise Business", "Land Development"]) {
    assert.match(venturesText, new RegExp(venture, "i"));
  }
  assert.doesNotMatch(venturesText, /Matrimony Manor/i);
});

test("the Team roster omits former project members", () => {
  const team = sectionById("team");
  assert.ok(team, "Expected a Team section");
  const teamText = stripMarkup(team);

  assert.doesNotMatch(teamText, /Sheikh Khidr Hussain/i);
  assert.doesNotMatch(teamText, /Mufti Walid Hamidi/i);
});
