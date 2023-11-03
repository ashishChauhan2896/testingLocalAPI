const fs = require("fs");
const path = require("path");

const { db } = require("../config/dbConnection");

const EmailTemplate = db.emailTemplate;
const Role = db.role;

const roleseeding = async (req, res) => {
  await Role.bulkCreate([
    { name: "superAdmin" },
    { name: "admin" },
    { name: "pharmacy" },
    { name: "doctor" },
    { name: "patient" }
  ]);
  return res
    .status(200)
    .json({ msg: "Roles seeded successfully." });
}

const emailTemplateseeding = async (req, res) => {
  let templates = ["welcome", "welcomeAdmin","forgotPassword"];
  let templateData = [];
  templates.forEach((value) => {
    let content =
      path.resolve(path.dirname("")) +
      "/src/email_templates/" +
      value +
      ".html";
    let data = fs.readFileSync(content);
    let html = data.toString();
    let templateDetails = {
      title: value,
      slug: `${value}_template`,
      context: html,
    };
    templateData.push(templateDetails);
  });
  EmailTemplate.bulkCreate(templateData)
    .then((template) => {
      return res
        .status(200)
        .json({ msg: "Email templates seeded successfully." });
    })
    .catch((err) => {
      return res.status(400).json({ msg: "Error in creating seeding" });
    });
};

module.exports = {
  roleseeding,
  emailTemplateseeding,
};
