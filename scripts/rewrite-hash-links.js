const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const replacements = [
  [/(\.\.\/)*index\.html#hotels/g, "/hotels.html"],
  [/(\.\.\/)*index\.html#car-rental/g, "/car-rental.html"],
  [/(\.\.\/)*index\.html#cars/g, "/car-rental.html"],
  [/(\.\.\/)*index\.html#tours/g, "/tours.html"],
  [/(\.\.\/)*index\.html#destinations/g, "/destinations.html"],
  [/(\.\.\/)*index\.html#contact/g, "/contact.html"],
  [/(\.\.\/)*index\.html#guides/g, "/guides.html"],
  [/(\.\.\/)*index\.html#guide\b/g, "/travel-guide.html"],
  [/(\.\.\/)*index\.html#community/g, "/travel-hub.html"],
  [/(\.\.\/)*index\.html#experiences/g, "/experiences.html"],
  [/(\.\.\/)*index\.html#videos/g, "/videos.html"],
  [/(\.\.\/)*index\.html#gallery/g, "/gallery.html"],
  [/(\.\.\/)*index\.html#about/g, "/about.html"],
  [/(\.\.\/)*index\.html#service-registration/g, "/register-service.html"]
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if ([".git", "node_modules", "scripts"].includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(html|js)$/i.test(name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  for (const [re, to] of replacements) text = text.replace(re, to);
  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    changed += 1;
    console.log("updated", path.relative(root, file));
  }
}
console.log("files changed:", changed);
