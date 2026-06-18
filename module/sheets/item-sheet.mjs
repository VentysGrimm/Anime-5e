const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class Anime5eItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["anime5e", "sheet", "item-sheet"],
    position: {
      width: 620
    },
    window: {
      resizable: true
    },
    form: {
      closeOnSubmit: false,
      handler: this._onSubmit,
      submitOnChange: false
    }
  };

  static PARTS = {
    form: {
      template: "systems/anime5e/templates/item-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    return context;
  }

  static async _onSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }
}
