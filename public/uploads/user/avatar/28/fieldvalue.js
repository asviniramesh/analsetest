//models/fieldvalue.js
App.Models.FieldValue = Backbone.Model.extend({
			initialize : function (a) {
				this.id = a.id;
				this.value = a.data
			},
			url : function () {
				if (this.isNew()) {
					return "fv"
				}
				return "fv/" + this.id
			}
		});
