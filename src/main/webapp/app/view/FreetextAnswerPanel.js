/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 app/view/FreetextAnswerPanel.js
 - Beschreibung: Zeigt Freitext-Antworten an
 - Version:      1.0, 11/06/12
 - Autor(en):    Christoph Thelen <christoph.thelen@mni.thm.de>
 +---------------------------------------------------------------------------+
 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or any later version.
 +---------------------------------------------------------------------------+
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 +--------------------------------------------------------------------------*/

Ext.define('ARSnova.view.FreetextAnswerPanel', {
	extend: 'Ext.Panel',
	
	config: {
		scroll: 'vertical',
		layout: 'fit',
		
		/**
		 * task for speakers in a session
		 * check every x seconds new feedback questions
		 */
		checkFreetextAnswersTask: null,
		
		freetextAnswerStore: null,
	},
	
	initialize: function(question, lastPanel) {
		this.callParent(arguments);
		
		this.questionObj = question;
		this.lastPanel = lastPanel;
		
		this.checkFreetextAnswersTask = {
			name: 'check for new freetext answers',
			scope: this,
			run: function() {
				this.checkFreetextAnswers();
			},
			interval: 15000
		},
		
		this.freetextAnswerStore = Ext.create('Ext.data.JsonStore', {
			model		: 'FreetextAnswer',
			sorters		: 'timestamp',
			groupField	: 'groupDate'
		});
		
		this.backButton = Ext.create('Ext.Button', {
			text	: Messages.BACK,
			ui		: 'back',
			scope	: this,
			handler	: function() {
				ARSnova.app.mainTabPanel.layout.activeItem.on('deactivate', function() {
					this.destroy();
				}, this, {single:true});
				ARSnova.app.mainTabPanel.animateActiveItem(ARSnova.app.mainTabPanel.tabPanel, {
					type		: 'slide',
					direction	: 'right',
					duration	: 700
				});
			}
		});
		
		this.toolbar = Ext.create('Ext.Toolbar', {
			title: Messages.QUESTION,
			docked: 'top',
			items: [this.backButton]
		});
		
		this.noFreetextAnswers = Ext.create('Ext.Panel', {
			cls: 'centerText',
			html: Messages.NO_ANSWERS
		});
		
		this.add([this.toolbar,
			ARSnova.view.FreetextAnswerList(this.freetextAnswerStore),
			this.noFreetextAnswers
		]);
		
		this.on('activate', function() {
			taskManager.start(this.checkFreetextAnswersTask);
		}, this);
		
		this.on('deactivate', function() {
			taskManager.stop(this.checkFreetextAnswersTask);
		}, this);
	},
	
	checkFreetextAnswers: function() {
		var self = this;
		
		ARSnova.app.questionModel.getAnsweredFreetextQuestions(localStorage.getItem("keyword"), this.questionObj._id, {
			success: function(response) {
				var responseObj = Ext.decode(response.responseText);
				var listItems = responseObj.map(function (item) {
					var v = item;
					return Ext.apply(item, {
						formattedTime	: new Date(v.timestamp).format("H:i"),
						groupDate		: new Date(v.timestamp).format("d.m.y")
					});
				});
				
				// Have the first answers arrived? Then remove the "no answers" message. 
				if (self.noFreetextAnswers.isVisible() && listItems.length > 0) {
					self.noFreetextAnswers.hide();
				} else if (!self.noFreetextAnswers.isVisible() && listItems.length === 0) {
					// The last remaining answer has been deleted. Display message again.
					self.noFreetextAnswers.show();
				}
				
				self.freetextAnswerStore.removeAll();
				self.freetextAnswerStore.add(listItems);
			},
			failure: function() {
				console.log('server-side error');
			}
		});
	}
});
