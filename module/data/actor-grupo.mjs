export class GrupoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      descricao: new f.StringField({ initial: "" }),
      fatos: new f.ArrayField(
        new f.SchemaField({
          id:          new f.StringField({ required: true, initial: () => foundry.utils.randomID() }),
          texto:       new f.StringField({ initial: "" }),
          rompido:     new f.BooleanField({ initial: false }),
          predefinido: new f.BooleanField({ initial: false }),
          tipo:        new f.StringField({ initial: "" }),
        }),
        { initial: [] }
      ),
      reservasCustom: new f.ArrayField(
        new f.SchemaField({
          id:           new f.StringField({ initial: () => foundry.utils.randomID() }),
          nome:         new f.StringField({ initial: "" }),
          atual:        new f.NumberField({ integer: true, min: 0, initial: 0 }),
          total:        new f.NumberField({ integer: true, min: 1, initial: 3 }),
          gatilho:      new f.StringField({ initial: "" }),
          consequencia: new f.StringField({ initial: "" }),
          pinnado:      new f.BooleanField({ initial: false }),
        }),
        { initial: [] }
      ),
      notas: new f.StringField({ initial: "" }),
    };
  }
}
