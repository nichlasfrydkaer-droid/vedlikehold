#!/usr/bin/env python3
"""Import the reviewed Danish KH work cards into the static job-card catalogue.

The source filenames are not authoritative: several files are duplicates or contain a
different card number.  The explicit manifest below is therefore intentionally keyed by
the number printed inside each PDF.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else ROOT.parent / "danske-arbejdskort"
DATA_DIR = ROOT / "public" / "jobdata" / "da"
PDF_DIR = ROOT / "public" / "pdf" / "da"

HALL = {
    "1": "Arbejdskort 1.pdf", "3": "Arbejdskort 11.pdf", "4": "Arbejdskort 4.pdf",
    "5": "Arbejdskort 5.pdf", "6": "Arbejdskort 6.pdf", "7": "Arbejdskort 7.pdf",
    "8": "Arbejdskort 8.pdf", "9": "Arbejdskort 16.pdf", "10": "Arbejdskort 10.pdf",
    "12": "Arbejdskort 12.pdf", "13": "Arbejdskort 22.pdf", "14": "Arbejdskort 14.pdf",
    "15": "Arbejdskort 28.pdf", "18": "Arbejdskort 18.pdf", "19": "Arbejdskort 19.pdf",
    "20": "Arbejdskort 20.pdf", "23": "Arbejdskort 23.pdf", "24": "Arbejdskort 24.pdf",
    "25": "Arbejdskort 25.pdf", "26": "Arbejdskort 26.pdf", "27": "Arbejdskort 27.pdf",
    "29": "Arbejdskort 29.pdf", "30": "Arbejdskort 30.pdf", "31A": "Arbejdskort 31.pdf",
    "33": "Arbejdskort 33.pdf", "34": "Arbejdskort 34.pdf", "35": "Arbejdskort 35.pdf",
    "36": "Arbejdskort 36.pdf", "38": "Arbejdskort 38.pdf", "39": "Arbejdskort 39.pdf",
}

APARTMENT = {
    "4": ("Arbejdskort Lejlighed 4.pdf", 0),
    "5": ("Arbejdskort Lejlighed 5.pdf", 0),
    "7": ("Arbejdskort Lejlighed 7.pdf", 0),
    "8": ("Arbejdskort Lejlighed 8.pdf", 0),
    "9": ("Arbejdskort Lejlighed 9.pdf", 0),
    "10": ("Arbejdskort Lejlighed 10.pdf", 0),
    "13": ("Arbejdskort Lejlighed 13.pdf", 0),
    "18": ("Arbejdskort Lejlighed 18.pdf", 0),
    "39": ("Arbejdskort Lejlighed 39.pdf", 0),
    "42": ("Arbejdskort Lejlighed 39.pdf", 2),
}

FREQUENCIES = (
    "Årligt tjek af menigheden", "Hver 3. måned", "Fireårigt service",
    "To-årigt service", "2-årig service", "Halvårligt Service",
    "Årlig service", "Halvårligt", "Månedligt", "Årligt", "Jævnligt",
)


def clean_line(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def printed_number(text: str) -> str:
    match = re.search(r"ARBEJDSKORT[ \t]+(\d+)(?:[ \t]*([A-Za-z]))?", text, re.I)
    if not match:
        raise ValueError("Card number is missing")
    return f"{int(match.group(1))}{(match.group(2) or '').upper()}"


def split_frequency(header: list[str]) -> tuple[str, str, str]:
    for index in range(len(header) - 1, 0, -1):
        line = header[index]
        for frequency in FREQUENCIES:
            if line.casefold().endswith(frequency.casefold()):
                title = clean_line(line[: -len(frequency)])
                if title:
                    return clean_line(" · ".join(header[1:index])), title, frequency
                if index > 1:
                    return clean_line(" · ".join(header[1:index - 1])), clean_line(header[index - 1]), frequency
    raise ValueError(f"Could not find frequency in header: {header!r}")


def interval_months(frequency: str) -> int:
    folded = frequency.casefold()
    if "månedligt" in folded or "jævnligt" in folded:
        return 1
    if "3. måned" in folded:
        return 3
    if "halvårligt" in folded:
        return 6
    if "fireårigt" in folded:
        return 48
    if "fem-årigt" in folded:
        return 60
    if "to-årigt" in folded or "2-årig" in folded:
        return 24
    return 12


def is_section_heading(line: str) -> bool:
    if line.startswith(("HUSK:", "OBS!", "NB!", "ADVARSEL:", "Placering:", "Tid anvendt:")):
        return False
    return line.endswith(":") or (
        len(line) <= 50
        and line[:1].isupper()
        and not line.endswith((".", "!", "?", ")"))
    )


def parse_card(text: str, expected_number: str, series: str, pdf_name: str) -> dict:
    lines = [clean_line(line) for line in text.splitlines()]
    lines = [line for line in lines if line and not re.fullmatch(r"KH\s*\d+", line, re.I)]
    actual = printed_number("\n".join(lines))
    if actual != expected_number:
        raise ValueError(f"Expected card {expected_number}, found {actual} in {pdf_name}")

    card_index = next(i for i, line in enumerate(lines) if re.match(r"ARBEJDSKORT\s+", line, re.I))
    time_index = next(i for i, line in enumerate(lines[card_index + 1 :], card_index + 1) if line.startswith("Tid anvendt"))
    category, title, frequency = split_frequency(lines[card_index:time_index])

    footer_index = next((i for i, line in enumerate(lines) if line.startswith("Notér herunder") or line == "Notater"), len(lines))
    body = lines[time_index + 1 : footer_index]
    time_value = clean_line(lines[time_index].partition(":")[2])
    placement = ""
    intro: list[str] = []
    groups: list[dict] = []
    current_heading = "Kontrolpunkter"
    current_points: list[str] = []
    current_point = ""
    bullets_started = False

    def flush_point() -> None:
        nonlocal current_point
        if current_point:
            current_points.append(clean_line(current_point))
            current_point = ""

    def flush_group() -> None:
        nonlocal current_points
        flush_point()
        if current_points:
            groups.append({"overskrift": current_heading, "punkter": current_points})
            current_points = []

    for line in body:
        if line.startswith("Placering:") and not bullets_started:
            placement = clean_line(line.removeprefix("Placering:"))
            continue
        if line.startswith("•"):
            bullets_started = True
            flush_point()
            current_point = clean_line(line[1:])
            continue
        if not bullets_started:
            if is_section_heading(line):
                current_heading = line.removesuffix(":")
                continue
            if not line.startswith("Tid anvendt"):
                intro.append(line)
            continue
        if is_section_heading(line):
            heading = line.removesuffix(":")
            if current_point or current_points:
                flush_group()
                current_heading = heading
            elif current_heading == "Kontrolpunkter":
                current_heading = heading
            else:
                current_heading = f"{current_heading} – {heading}"
        else:
            current_point = f"{current_point} {line}".strip()

    flush_group()
    if not groups:
        raise ValueError(f"No checklist points found in {pdf_name}")

    notice_parts = []
    if placement:
        notice_parts.append(f"Placering: {placement}")
    if intro:
        if "fem-årigt" in time_value.casefold():
            if intro[0].casefold().startswith("autoriseret"):
                intro.pop(0)
            intro.insert(0, "Fem-årigt service skal udføres af en autoriseret fagperson.")
        notice_parts.append(" ".join(intro))

    slug = f"{'apartment' if series == 'apartment' else 'hall'}-{expected_number.lower()}"
    return {
        "key": f"da:{series}:{expected_number.upper()}",
        "slug": slug,
        "series": series,
        "nummer": expected_number,
        "titel": title,
        "undertittel": category,
        "frekvens": frequency,
        "jobbkortPdf": pdf_name,
        "sjaPdf": "",
        "sjaVeiledningPdf": "",
        "arbeidTrygtPdf": "",
        "merk": "\n\n".join(notice_parts),
        "oppgaver": groups,
        "notatInfo": "Notér de forhold, du opdager, men ikke selv må eller kan udbedre.",
        "intervalMonths": interval_months(frequency),
    }


def page_text(source_name: str, page_number: int | None = None) -> str:
    reader = PdfReader(SOURCE / source_name)
    pages = reader.pages if page_number is None else [reader.pages[page_number]]
    return "\n".join(page.extract_text() or "" for page in pages)


def write_single_page_pdf(source_name: str, page_number: int, target: Path) -> None:
    reader = PdfReader(SOURCE / source_name)
    writer = PdfWriter()
    writer.add_page(reader.pages[page_number])
    with target.open("wb") as output:
        writer.write(output)


def main() -> None:
    if not SOURCE.is_dir():
        raise SystemExit(f"Source directory does not exist: {SOURCE}")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    cards: list[dict] = []

    for number, source_name in HALL.items():
        pdf_name = f"arbejdskort-{number.lower()}.pdf"
        shutil.copyfile(SOURCE / source_name, PDF_DIR / pdf_name)
        card = parse_card(page_text(source_name), number, "hall", pdf_name)
        (DATA_DIR / f"{card['slug']}.json").write_text(json.dumps(card, ensure_ascii=False, indent=2) + "\n")
        cards.append(card)

    for number, (source_name, page_number) in APARTMENT.items():
        pdf_name = f"arbejdskort-lejlighed-{number.lower()}.pdf"
        write_single_page_pdf(source_name, page_number, PDF_DIR / pdf_name)
        card = parse_card(page_text(source_name, page_number), number, "apartment", pdf_name)
        (DATA_DIR / f"{card['slug']}.json").write_text(json.dumps(card, ensure_ascii=False, indent=2) + "\n")
        cards.append(card)

    cards.sort(key=lambda card: (int(re.match(r"\d+", card["nummer"]).group()), card["nummer"], card["series"]))
    (DATA_DIR / "index.json").write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n")
    print(f"Imported {len(cards)} Danish work cards ({len(HALL)} hall, {len(APARTMENT)} apartment).")


if __name__ == "__main__":
    main()
