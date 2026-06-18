const fields = foundry.data.fields;

function numberField(initial = 0, options = {}) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    integer: true,
    initial,
    ...options
  });
}

function textField(initial = "") {
  return new fields.StringField({
    required: true,
    blank: true,
    initial
  });
}

class Anime5eBaseItemData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["ANIME5E.Item"];

  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      rank: numberField(1, { min: 0 }),
      cost: numberField(0, { min: 0 }),
      source: textField()
    };
  }
}

export class Anime5eEquipmentData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: new fields.BooleanField({ required: true, initial: false })
    };
  }
}

export class Anime5eFeatureData extends Anime5eBaseItemData {}

export class Anime5ePowerData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField()
    };
  }
}
