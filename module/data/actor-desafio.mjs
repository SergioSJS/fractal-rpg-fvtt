export class DesafioData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      descricao: new f.StringField({ initial: "" }),
      tipo:      new f.StringField({ initial: "" }),
      // No SRD v1.0.2 os componentes do Desafio chamam-se "Obstáculos"
      // ("Esses fatos dos Desafios são chamados de Obstáculos").
      // O nome do campo permanece "fatos" para compatibilidade com dados salvos.
      fatos: new f.ArrayField(
        new f.SchemaField({
          id:          new f.StringField({ required: true, initial: () => foundry.utils.randomID() }),
          texto:       new f.StringField({ initial: "" }),
          // Nome interno legado (v1.0.1 usava "Rompido"); na v1.0.2 é "Quebrado" só na UI.
          rompido:     new f.BooleanField({ initial: false }),
          predefinido: new f.BooleanField({ initial: false }),
          tipo:        new f.StringField({ initial: "" }),
        }),
        { initial: [] }
      ),
      reservas:      new f.ObjectField({ initial: {} }),
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
      reservasPinnadas: new f.ArrayField(new f.StringField(), { initial: [] }),
      notas_arquiteto: new f.StringField({ initial: "" }),
    };
  }

  get todosRompidos() {
    return this.fatos.length > 0 && this.fatos.every(f => f.rompido);
  }
}
