(function(module) {
  mifosX.controllers = _.extend(module, {
    ViewClientController: function(scope, routeParams , route, location, resourceFactory, http) {
        scope.client = [];
        scope.identitydocuments = [];
        scope.buttons = [];
        scope.clientdocuments = [];

        resourceFactory.clientResource.get({clientId: routeParams.id} , function(data) {
            scope.client = data;

            if (data.imagePresent) {
              http({
                method:'GET',
                url: 'https://demo.openmf.org/mifosng-provider/api/v1/clients/'+routeParams.id+'/images'
              }).then(function(imageData) {
                scope.image = imageData.data;
              });
            }
            if (data.status.value == "Pending") {
              scope.buttons = [{
                                name:"button.edit",
                                href:"#/editclient",
                                icon :"icon-edit"
                              },
                              {
                                name:"button.activate",
                                href:"#/client",
                                subhref:"activate",
                                icon :"icon-ok-sign"
                              },
                              {
                                name:"button.delete",
                                href:"#/client",
                                subhref:"delete",
                                icon :"icon-warning-sign"
                              },
                              {
                                name:"button.close",
                                href:"#/client",
                                subhref:"close",
                                icon :"icon-remove-circle"
                              }]
                            
              }

            if (data.status.value == "Active") {
              scope.buttons = [{
                                name:"button.edit",
                                href:"#/editclient",
                                icon :"icon-edit"
                              },
                              {
                                name:"button.newloan",
                                href:"#/newclientloanaccount",
                                icon :"icon-plus"
                              },
                              {
                                name:"link.new.savings.application",
                                href:"#/new_client_saving_application",
                                icon :"icon-plus"
                              },
                              {
                                name:"button.transferclient",
                                href:"#/transferclient",
                                icon :"icon-arrow-right"
                              },
                              {
                                name:"button.close",
                                href:"#/client",
                                subhref:"close",
                                icon :"icon-remove-circle"
                              }]
            }

            if (data.status.value == "Pending" || data.status.value == "Active"){
              if(data.staffId) {
                scope.buttons.push({
                  name:"button.unassignstaff",
                  href:"#/client",
                  subhref:"unassignstaff?staffId="+data.staffId,
                  icon :"icon-user"
                });
              } else {
                scope.buttons.push({
                  name:"button.assignstaff",
                  href:"#/client",
                  subhref:"assignstaff",
                  icon :"icon-user"
                });
              }
            }

          resourceFactory.runReportsResource.get({reportSource: 'ClientSummary',genericResultSet: 'false',R_clientId: routeParams.id} , function(data) {
            scope.client.ClientSummary = data[0];
          });
        });

        resourceFactory.clientAccountResource.get({clientId: routeParams.id} , function(data) {
            scope.clientAccounts = data;
        });

        resourceFactory.clientNotesResource.getAllNotes({clientId: routeParams.id} , function(data) {
            scope.clientNotes = data;
        });
        scope.getClientIdentityDocuments = function () {
          resourceFactory.clientResource.getAllClientDocuments({clientId: routeParams.id, anotherresource: 'identifiers'} , function(data) {
              scope.identitydocuments = data;
              for(var i = 0; i<scope.identitydocuments.length; i++) {
                resourceFactory.clientIdentifierResource.get({clientIdentityId: scope.identitydocuments[i].id} , function(data) {
                  for(var j = 0; j<scope.identitydocuments.length; j++) {
                     if(data.length > 0 && scope.identitydocuments[j].id == data[0].parentEntityId)
                      {
                        scope.identitydocuments[j].documents = data;
                      }
                  }
                });
              }
          });
        };

        scope.getClientTemplateDocuments = function() {
          resourceFactory.templateResource.get({entityId : 0, typeId : 0}, function(data) {
            scope.clientTemplateData = data;
          })
        }

        resourceFactory.DataTablesResource.getAllDataTables({apptable: 'm_client'} , function(data) {
          scope.clientdatatables = data;
        });

        scope.dataTableChange = function(clientdatatable) {
          resourceFactory.DataTablesResource.getTableDetails({datatablename: clientdatatable.registeredTableName,
          entityId: routeParams.id, genericResultSet: 'true'} , function(data) {
            scope.datatabledetails = data;
            scope.datatabledetails.isData = data.data.length > 0 ? true : false;
            scope.datatabledetails.isMultirow = data.columnHeaders[0].columnName == "id" ? true : false;

            for(var i in data.columnHeaders) {
              if (scope.datatabledetails.columnHeaders[i].columnCode) {
                for (var j in scope.datatabledetails.columnHeaders[i].columnValues){
                  for(var k in data.data) {
                    if (data.data[k].row[i] == scope.datatabledetails.columnHeaders[i].columnValues[j].id) {
                      data.data[k].row[i] = scope.datatabledetails.columnHeaders[i].columnValues[j].value;
                    }
                  }
                }
              } 
            }

          });
        };

        scope.deleteAll = function (apptableName, entityId) {
          resourceFactory.DataTablesResource.delete({datatablename:apptableName, entityId:entityId, genericResultSet:'true'}, {}, function(data){
            route.reload();
          });
        };

        scope.getClientDocuments = function () {
          resourceFactory.clientDocumentsResource.getAllClientDocuments({clientId: routeParams.id} , function(data) {
            scope.clientdocuments = data;
          });
        };

        scope.deleteDocument = function (documentId, index) {
          resourceFactory.clientDocumentsResource.delete({clientId: routeParams.id, documentId: documentId}, '', function(data) {
            scope.clientdocuments.splice(index,1);
          });
        };

        scope.downloadDocument = function(documentId) {
            resourceFactory.clientDocumentsResource.get({clientId: routeParams.id, documentId: documentId}, '', function(data) {
                scope.clientdocuments.splice(index,1);
            });
        };
        scope.isNotClosed = function(loanaccount) {
          if(loanaccount.status.code === "loanStatusType.closed.written.off" || 
            loanaccount.status.code === "loanStatusType.rejected") {
            return false;
          } else{
             return true;
          }
        };

        scope.isClosed = function(loanaccount) {
          if(loanaccount.status.code === "loanStatusType.closed.written.off" || 
            loanaccount.status.code === "loanStatusType.rejected") {
            return true;
          } else{
             return false;
          }
        };


        scope.saveNote = function() {   
            resourceFactory.clientResource.save({clientId: routeParams.id, anotherresource: 'notes'}, this.formData , function(data){
            var today = new Date();
            temp = { id: data.resourceId , note : scope.formData.note , createdByUsername : "test" , createdOn : today } ;
            scope.clientNotes.push(temp);
            scope.formData.note = "";
            scope.predicate = '-id';
          });
        }

        scope.deleteClientIdentifierDocument = function (clientId, entityId, index){
          resourceFactory.clientIdenfierResource.delete({clientId: clientId, id: entityId}, '', function(data) {
            scope.identitydocuments.splice(index,1);
          });
        };

        scope.downloadClientIdentifierDocument=function (identifierId, documentId){
          console.log(identifierId,documentId);
        };
    }
  });
  mifosX.ng.application.controller('ViewClientController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', mifosX.controllers.ViewClientController]).run(function($log) {
    $log.info("ViewClientController initialized");
  });
}(mifosX.controllers || {}));
