/**
 * Data definition for Actor documents
 */
export class AnimeActorData extends foundry.abstract.TypeDataModel {
    /** @inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            abilities: new fields.SchemaField({
                str: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 1, max: 20}),
                    mod: new fields.NumberField()
                }),
                dex: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 1, max: 20}),
                    mod: new fields.NumberField()
                }),
                con: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 1, max: 20}),
                    mod: new fields.NumberField()
                }),
                int: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 1, max: 20}),
                    mod: new fields.NumberField()
                }),
                wis: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 1, max: 20}),
                    mod: new fields.NumberField()
                }),
                cha: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 1, max: 20}),
                    mod: new fields.NumberField()
                })
            }),
            attributes: new fields.SchemaField({
                hp: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 0}),
                    max: new fields.NumberField({initial: 10, min: 0}),
                    base: new fields.NumberField({initial: 10, min: 0})
                }),
                mp: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 0}),
                    max: new fields.NumberField({initial: 10, min: 0}),
                    base: new fields.NumberField({initial: 10, min: 0})
                }),
                ac: new fields.SchemaField({
                    value: new fields.NumberField({initial: 10, min: 0}),
                    base: new fields.NumberField({initial: 10, min: 0}),
                    bonus: new fields.NumberField({initial: 0})
                })
            }),
            level: new fields.NumberField({initial: 1, min: 1, max: 20}),
            experience: new fields.NumberField({initial: 0, min: 0}),
            points: new fields.SchemaField({
                starting: new fields.NumberField({initial: 100, min: 0}),
                spent: new fields.NumberField({initial: 0, min: 0}),
                remaining: new fields.NumberField({initial: 100, min: 0}),
                breakdown: new fields.SchemaField({
                    abilities: new fields.SchemaField({
                        cost: new fields.NumberField({initial: 0}),
                        points: new fields.NumberField({initial: 0})
                    }),
                    skills: new fields.SchemaField({
                        cost: new fields.NumberField({initial: 0}),
                        points: new fields.NumberField({initial: 0})
                    }),
                    attributes: new fields.SchemaField({
                        cost: new fields.NumberField({initial: 0}),
                        points: new fields.NumberField({initial: 0})
                    }),
                    powers: new fields.SchemaField({
                        cost: new fields.NumberField({initial: 0}),
                        points: new fields.NumberField({initial: 0})
                    }),
                    defects: new fields.SchemaField({
                        cost: new fields.NumberField({initial: 0}),
                        points: new fields.NumberField({initial: 0})
                    })
                }),
                racial: new fields.SchemaField({
                    attributes: new fields.NumberField({initial: 0}),
                    defects: new fields.NumberField({initial: 0}),
                    total: new fields.NumberField({initial: 0})
                })
            })
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        // Handle data migration when needed
        return source;
    }

    /** @inheritdoc */
    static validateData(source) {
        // Validate data integrity
        return true;
    }
} 