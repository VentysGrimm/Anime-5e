# Anime 5e Content Module Workflow

Use `module-template/` when a supplement should become a standalone Foundry module instead of staying in the base system's `data/sources/supplements/` staging area.

## Create A Module

1. Copy `module-template/` to a new module repository or Foundry `Data/modules/<module-id>` folder.
2. Replace `anime5e-example-expansion` everywhere with the final module id.
3. Replace `EXAMPLE` with a stable source abbreviation such as `FOL`, `BWO`, or `MML1`.
4. Update `module.json` title, description, authors, pack labels, manifest/download URLs if used, and version.
5. Keep the Anime 5e dependency in `module.json` under `relationships.systems`.
6. Set `module.json` `packFolders` to the source book title and include every declared pack so Foundry groups the module's compendiums by book in the sidebar.

## Source Data

Module source JSON should live under `data/sources/` in the module and be included by `data/source-manifest.json`.

Every source-backed document should carry:

- Source book or product title.
- PDF viewer page number when available.
- Source abbreviation.
- Module id.
- Content category.
- Stable `sourceId` and matching `importId`.
- `rank` and `cost` for Item documents.

For Item documents, use the flat Anime 5e system fields:

```json
{
  "system": {
    "source": "Anime 5e Example Expansion",
    "sourcePage": 1,
    "sourceAbbreviation": "EXAMPLE",
    "sourceModuleId": "anime5e-example-expansion",
    "sourceCategory": "attribute",
    "sourceId": "example.attribute.example-attribute",
    "importId": "example.attribute.example-attribute",
    "rank": 1,
    "cost": 1
  }
}
```

For Actor and Journal documents, use `flags.anime5e.source` or the Actor `system.source` object:

```json
{
  "flags": {
    "anime5e": {
      "sourceId": "example.journal.overview",
      "source": {
        "book": "Anime 5e Example Expansion",
        "page": 1,
        "abbreviation": "EXAMPLE",
        "moduleId": "anime5e-example-expansion",
        "category": "journal",
        "importId": "example.journal.overview"
      }
    }
  }
}
```

## Validate

From the base system repository, run:

```powershell
node tools\validate-content-module.mjs module-template
```

For a real module:

```powershell
node tools\validate-content-module.mjs C:\Users\Owner\AppData\Local\FoundryVTT\Data\modules\<module-id>
```

The helper checks required module directories, the Anime 5e dependency convention, declared pack paths, book-level `packFolders`, source includes, source tags, source IDs, and Item rank/cost fields.

## Import Flow

The base system importer is still responsible for the in-system staged supplemental packs. A standalone module can reuse the same source JSON shape and import strategy, but it should import into module-owned pack IDs such as:

```text
<module-id>.character-options
<module-id>.items
<module-id>.creatures
<module-id>.journals
```

Keep source IDs stable when moving staged content from `data/sources/supplements/` into a standalone module.
