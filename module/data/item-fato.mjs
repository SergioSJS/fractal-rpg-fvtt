export class FatoItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      categoria:   new f.StringField({ initial: "" }),
      descricao:   new f.HTMLField({ initial: "" }),
      obrigatorio: new f.BooleanField({ initial: false }),
    };
  }
}
