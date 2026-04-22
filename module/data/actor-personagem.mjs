export class PersonagemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      xp: new f.SchemaField({
        value: new f.NumberField({ integer: true, min: 0, initial: 0, required: true }),
      }),
      fatos: new f.ArrayField(
        new f.SchemaField({
          id:          new f.StringField({ required: true, initial: () => foundry.utils.randomID() }),
          texto:       new f.StringField({ required: false, initial: "" }),
          rompido:     new f.BooleanField({ initial: false }),
          predefinido: new f.BooleanField({ initial: false }),
          tipo:        new f.StringField({ initial: "" }),
        }),
        { initial: [] }
      ),
      reservas: new f.ObjectField({ initial: {} }),
      anotacoes: new f.HTMLField({ required: false, initial: "" }),
      aparencia: new f.SchemaField({
        background_url: new f.StringField({ initial: "" }),
        cor_accent:     new f.StringField({ initial: "" }),
      }),
    };
  }
}
