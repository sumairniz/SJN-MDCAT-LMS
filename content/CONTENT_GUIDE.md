# SJN LMS Content Guide

The public LMS has no content-entry panel. You control academy content through these files.

## 1. Courses

Edit `content/seed.json`:

```json
{
  "courses": [
    {
      "title": "Biology Mastery",
      "description": "Full Biology course",
      "chapters": ["Cell Biology", "Biomolecules", "Genetics"],
      "body": "Your course notes/overview here."
    }
  ],
  "pastPapers": [],
  "resources": [],
  "banks": ["Past Papers Question Bank"]
}
```

## 2. Past Papers

Add a paper object to `pastPapers`. The `title` is also used as the `source` value for matching imported MCQs.

```json
{
  "title": "UHS MDCAT 2025",
  "year": "2025",
  "description": "Official past-paper practice set",
  "pdfUrl": "/resources/uhs-mdcat-2025.pdf"
}
```

Then put matching MCQs in `content/mcqs.json` with:

```json
"source": "UHS MDCAT 2025"
```

## 3. Study PDFs

Put the PDF in `content/resources/`, then add:

```json
{
  "title": "PMDC Syllabus",
  "description": "Current syllabus PDF",
  "type": "pdf",
  "url": "/resources/pmdc-syllabus.pdf",
  "category": "Syllabus"
}
```

Students can open the PDF directly inside the right-side Study Resources viewer.

## 4. Bulk MCQs

Copy `content/mcqs.example.json` to `content/mcqs.json` and put as many MCQs as you want in the array: 50, 100, 200, 500, 1000, etc.

Every imported question is automatically assigned to the only bank:

**Past Papers Question Bank**

Required fields:
- subject
- chapter
- topic
- question
- exactly 4 options
- correctIndex: 0, 1, 2 or 3

Optional:
- explanation
- mnemonic
- source

Run `npm run sync-mcqs` after adding the file.
