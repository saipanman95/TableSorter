/**
 * TableSorter class is used for conducting client side sorting and filtering 
 * table data up to 1000 records.
 * @example var ts = new TableSorter();
 ts.init('myTable');
 * @returns {TableSorter}
 */
function TableSorter() {

    var self = this;
    /**
     * local storage data structure of table sort/filter data
     * @type Array
     */
    var ls = [{
            "ls-options": {
                "key": "",
                "columnClicked": "",
                "dir": "",
                "filterText": "",
                "refreshed": "",
                "recordOptions": {
                    "recordClicked": "",
                    "recordPosition": ""
                }
            }
        }];
    /**
     * Method initializes table sort/filter data in local storage and adds new tableData based on existence in JSON object.
     * @param {type} tableId
     * @returns {undefined}
     */
    this.initLocalStorage = function (tableId) {
        var lsInstance = self.getLocalStorage();
        var thisLs = JSON.parse(lsInstance.getItem("ls"));
        //if no table sort/filter data exist create some
        if (!self.doesJsonExist(thisLs)) {
            for (var i = 0; i < ls.length; i++) {
                for (var l in ls[i]) {
                    ls[i][l].key = tableId;
                    ls[i][l].dir = "asc";
                    ls[i][l].columnClicked = "";
                    ls[i][l].filterText = "";
                    ls[i][l].refreshed = "false";
                    ls[i][l].recordOptions.recordClicked = "";
                    ls[i][l].recordOptions.recordPosition = "";
                }
            }

            lsInstance.setItem("ls", JSON.stringify(ls));
        } else {
            //otherwise we no sort/filter data exists for at least one table
            //but does it exist for our current table 
            var flag = false;
            var children;
            //this logic determines if table data exists for this table
            for (var i = 0; i < thisLs.length; i++) {
                for (var l in thisLs[i]) {
                    if (thisLs[i][l].key === tableId) {
                        flag = true;
                        //break because no need to keep looping
                        break;
                    }
                }
            }
            //if it does not exist then initialize a new set of data to be added 
            //to collection
            if (flag === false) {
                for (var i = 0; i < ls.length; i++) {
                    for (var l in ls[i]) {
                        ls[i][l].key = tableId;
                        ls[i][l].dir = "asc";
                        ls[i][l].columnClicked = "";
                        ls[i][l].filterText = "";
                        ls[i][l].refreshed = "false";
                        ls[i][l].recordOptions.recordClicked = "";
                        ls[i][l].recordOptions.recordPosition = "";
                    }
                }
                //adding new table data to existing
                children = thisLs.concat(ls);
            } else {
                //just setting variable to return what currently exists
                children = thisLs;
            }
            //putting table sort/filter data back in local storage
            lsInstance.setItem("ls", JSON.stringify(children));
        }
    };
    /**
     * Method called to initialize, decorate, and enhance current html table
     * @param {type} tableId - this is the actual tableId; do not add the # to 
     * the id; the code will provide it automatically
     * @returns {void}
     */
    this.init = function (tableId, useCallBack, callback, recordId) {

        self.initLocalStorage(tableId);
        $("head").append("<link rel='stylesheet' id='extracss' href='js/tableSorter/tableSorter.css' type='text/css' />");
        $("#" + tableId).on('click', 'tr', function () {
            var text = $(this).children('td.dt-sort-id').text();
            self.highlightRow($.trim(text), tableId);
            self.updateLsClickPoint("recordClicked", text, tableId);
        });
        $("#" + tableId).wrapAll("<div id='dt-inner-div-" + tableId + "' class='dt dt-inner-div'/>");
        $('#dt-inner-div-' + tableId).wrapAll("<div id='dt-table-wrapper-div-" + tableId + "' class='dt dt-table-wrapper-div'/>");
        $('#dt-table-wrapper-div-' + tableId).prepend("<table id='dt-header-" + tableId + "' class='dt dt-header'><thead id='dt-header-" + tableId + "'></thead></table>");
        $('#dt-table-wrapper-div-' + tableId).wrapAll("<div id='dt-outer-div-" + tableId + "' class='dt dt-outer-div'/>");
        $('#dt-outer-div-' + tableId).before("<label for='dt-filter-id-" + tableId + "' class='dt dt-filter-id'>Filter List: </label> <input id='dt-filter-id-" + tableId + "' type='text' class='dt dt-filter'/>");
        $('#dt-outer-div-' + tableId).before("<span style='padding-left: 15px;' class='dt dt-filter-txt' id='dt-filter-txt-" + tableId + "'>...</span> ");
        $('#dt-outer-div-' + tableId).before("<br/><a href='#' class='dt dt-filter-clear' id='dt-filter-clear-" + tableId + "' title='Clear Filter/Sort Criteria'>Clear</a>");

        self.decorateHeaders('table#' + tableId, "#dt-header-" + tableId);
        $('#dt-header-' + tableId + ' tr th').click(function () {
            self.updateLocalStorage('refreshed', 'false', tableId);
            self.sortColumn(this, tableId);
            self.calculateCellItems(tableId);
        });
        
        $('#dt-filter-clear-' + tableId).click(function () {
            self.removeItemFromLocalStorage(tableId);
            self.refreshDataPoint(tableId, useCallBack, callback, recordId);
        });
        self.calculateCellItems(tableId);

        var $rows = $('#' + tableId + ' tbody tr');
        $('#dt-filter-id-' + tableId).keyup(function () {
            var filterText = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase().split(' ');
            $('#dt-filter-txt-' + tableId).text(filterText);
            self.filter(filterText, $rows, tableId);
            self.calculateCellItems(tableId);
        });
        self.refreshDataPoint(tableId, useCallBack, callback, recordId);
        $('table tbody tr:even:not(:first)').addClass('stripped-row');
        $('table tbody tr').not(':first').hover( function(){
           $(this).addClass('hover-row-class'); 
        }, function(){
            $(this).removeClass('hover-row-class');
        });
    };
    /**
     * Method remove local data on sort and filter form local storage
     * @param {type} tableId
     * @returns {undefined}
     */
    this.removeItemFromLocalStorage = function (tableId) {
        var lsInstance = self.getLocalStorage();
        var thisLs = JSON.parse(lsInstance.getItem("ls"));
        for (var i = 0; i < thisLs.length; i++) {
            for (var l in thisLs[i]) {
                if (thisLs[i][l].key === tableId) {
                    thisLs.splice(i, 1);
                }
            }
        }
        lsInstance.setItem("ls", JSON.stringify(thisLs));
    };
    /**
     * Method called when browser is refreshed or page reloaded. Used primarily for reloading local storage data of previous sort/filter criteria
     * @param {type} tableId
     * @param {boolean} useCallBack
     * @param {function} callback
     * @param {id} recordId
     * @returns {undefined}
     */
    this.refreshDataPoint = function (tableId, useCallBack, callback, recordId ) {
        var colNum = this.getLsItem('columnClicked', tableId);
        this.updateLocalStorage('refreshed', true, tableId);
        var cn = Number(colNum) + 1;
        var col = $('#dt-header-' + tableId + ' tr th:nth-child(' + cn + ')');
        self.sortColumn(col[0], tableId);
        var filterText = this.getLsItem('filterText', tableId);
        var recordClicked = self.getLsItem('recordOptions.recordClicked', tableId);
        $("#dt-filter-id-" + tableId).val(filterText);
        $('#dt-filter-txt-' + tableId).text(filterText);
        var $rows = $('#' + tableId + ' tbody tr');
        //triggering keyup action to invoke filter
        $('#dt-filter-id-' + tableId).keyup();
        
        if($.isEmptyObject(recordClicked)){
            
        } else  {
            if(useCallBack){
                self.evalCurrentRecord(recordId, tableId, callback);
            }
            self.highlightRow(recordClicked, tableId);
            $(window).load(function () {
                self.scrollToRecord(recordClicked, tableId);
            });
        }
        self.calculateCellItems(tableId);
    };
    
    /**
     * Method is intended to be used to invoke callback function wrapped in function(){ .... }.
     * @param {type} recordId
     * @param {type} tableId
     * @param {type} callback - to be used like so: function(){ loadThisRecordUrl(url, transId, user);}
     * @returns {boolean} - will return true or false
     */
    this.evalCurrentRecord = function(recordId, tableId, callback){
        var recordClicked = self.getLsItem('recordOptions.recordClicked', tableId);
        if($.isEmptyObject(recordClicked)){
            callback();
            return false;
        } else {
            if (Number(recordClicked) !== Number(recordId)){
                callback();
                return false;
            } else {
                self.updateLsClickPoint("recordClicked", recordId, tableId);
            }
        }
        return true;
    };
    
    this.updateLsClickPoint = function (key, value, tableId) {
        var lsInstance = self.getLocalStorage();
        var thisLs = JSON.parse(lsInstance.getItem("ls"));
        for (var i = 0; i < thisLs.length; i++) {
            for (var l in thisLs[i]) {
                if (thisLs[i][l].key === tableId) {
                    thisLs[i][l].key = tableId;
                    thisLs[i][l]["recordOptions"][key] = value;
                }
            }
        }
        lsInstance.setItem("ls", JSON.stringify(thisLs));
    };
    this.highlightRow = function (rowId, tableId) {
        $("#" + tableId + " tr").removeClass('row-select-hightlight');
        $("#" + tableId).find("td[dt-sort-id='" + rowId + "']").parent('tr').addClass('row-select-hightlight');
        self.captureLocation(rowId, tableId);
    };
    this.captureLocation = function (rowId, tableId) {
        var row = $("#" + tableId).find("td[dt-sort-id='" + rowId + "']").parent('tr').position();
        if ($.isEmptyObject(row) === false) {
            self.updateLsClickPoint('recordPosition', row.top, tableId);
        }
    };
    this.scrollToRecord = function (rowId, tableId) {
        $('#dt-inner-div-' + tableId).scrollTop(1);
        var doAgain = false;
        var windowOffset = $('#dt-inner-div-' + tableId).position();
        var row = $("#" + tableId).find("td[dt-sort-id='" + rowId + "']").position();
        if ($.isEmptyObject(row)) {
            return;
        }
        if (row.top < 0) {
            doAgain = true;
        }

        var offsetPos;
        var pos = row.top - windowOffset.top;
        if (pos > 100) {
            offsetPos = pos - 90;
        } else {
            offsetPos = pos;
        }
        $('#dt-inner-div-' + tableId).scrollTop(offsetPos);
        if (doAgain) {
            self.scrollToRecord(rowId, tableId);
        }
    };
    this.updateLocalStorage = function (key, value, tableId) {
        var lsInstance = self.getLocalStorage();
        var thisLs = JSON.parse(lsInstance.getItem("ls"));
        for (var i = 0; i < thisLs.length; i++) {
            for (var l in thisLs[i]) {
                if (thisLs[i][l].key === tableId) {
                    thisLs[i][l].key = tableId;
                    thisLs[i][l][key] = value;
                }
            }
        }
        lsInstance.setItem("ls", JSON.stringify(thisLs));
    };
    this.getLsItem = function (key, tableId) {
        var lsInstance = self.getLocalStorage();
        var thisLs = JSON.parse(lsInstance.getItem("ls"));
        //only breaking out of logic if nothing exists yet;
        if($.isEmptyObject(thisLs)){
            return;
        }
        var returnVal = "";
        if (key.indexOf('recordOptions') > -1) {
            var keys = key.split(".");
            if (keys.length > 1) {
                var k = keys[1];
                for (var i = 0; i < thisLs.length; i++) {
                    for (var l in thisLs[i]) {
                        if (thisLs[i][l].key === tableId) {
                            thisLs[i][l].key = tableId;
                            returnVal = thisLs[i][l].recordOptions[k];
                        }
                    }
                }
            }
            return $.trim(returnVal);
        }
        for (var i = 0; i < thisLs.length; i++) {
            for (var l in thisLs[i]) {
                if (thisLs[i][l].key === tableId) {
                    thisLs[i][l].key = tableId;
                    returnVal = thisLs[i][l][key];
                }
            }
        }
        return $.trim(returnVal);
    };

    this.getLocalStorage = function () {
        return localStorage;
    };
    /**
     * Method decorates headers and makes table scrollable
     * @param {type} tableHeaderIdentifier
     * @param {type} dtheader
     * @returns {undefined}
     */
    this.decorateHeaders = function (tableHeaderIdentifier, dtheader) {

        $(tableHeaderIdentifier + " thead tr th").append("<span class='dt-sort-icon-bg'> </span>");
        $(dtheader + " thead").html($(tableHeaderIdentifier + " thead").html());
        $(dtheader + " thead tr th").hover(function () {
            $(this).addClass('hover-text-color');
        }, function () {
            $(this).removeClass('hover-text-color');
        });
        $(tableHeaderIdentifier + " thead").html("");
    };
    this.calculateCellItems = function (tableId) {
        var rows = $('#' + tableId + ' tbody tr');
        var singleRow;
        for (var r in rows) {
            //associate array index sometimes is not a number; we are only 
            //interested in array indexs here that are numbers; hense !isNaN(r)
            if (!isNaN(r)) {
                var className = rows[r].className;
                if (className.indexOf("hidden-row") === -1) {
                    singleRow = rows[r];
                    break; //only need first row
                    //console.log("did not find hidden-row");
                }
            }
        }

        if ($.isEmptyObject(singleRow)) {
            return;
        }
        var cells = singleRow.cells;
        var tdWidthArr = new Array();
        for (var c in cells) {
            if (!isNaN(c)) {
                //tdWidthArr[c] = $(cells[c]).width();
                var w = Math.ceil($(cells[c])[0].getBoundingClientRect().width);
                tdWidthArr[c] = w;
                //console.log($(cells[c]).id + " = " + $(cells[c]).width() + " vs " + w);
            }
        }
        var ths = $("#dt-header-" + tableId + " tr")[0].cells;
        for (var t in ths) {
            if (!isNaN(t)) {
                $(ths[t]).width(tdWidthArr[t]);
                $(ths[t]).css('textAlign', 'left');
            }
        }
    };

    this.filter = function (filterText, $rows, tableId) {
        $rows.hide().filter(function () {
            var text = $(this).text().replace(/\s+/g, ' ').toLowerCase();
            var matchesSearch = true;
            $(filterText).each(function (index, value) {
                matchesSearch = (!matchesSearch) ? false : ~text.indexOf(value);
            });
            return matchesSearch;
        }).show();
        self.calculateCellItems(tableId);

        self.updateLocalStorage("filterText", filterText, tableId);
    };

    /**
     * Utility method for determining if the columned being sorted should be asc or desc
     * @param {type} tableId
     * @returns {String}
     */
    this.trackColumnSort = function (tableId) {
        //the outer if statement is checking if exists -- js treats undefined as false
        if (self.getLsItem('dir', tableId)) {
            if (self.getLsItem('dir', tableId) === 'asc' && self.isTrue(self.getLsItem('refreshed', tableId)) === true) {
                self.updateLocalStorage('dir', 'asc', tableId);
                return 'asc';
            } else if (self.getLsItem('dir', tableId) === 'asc' && self.isTrue(self.getLsItem('refreshed', tableId)) === false) {
                self.updateLocalStorage('dir', 'desc', tableId);
                return 'desc';
            } else if (self.getLsItem('dir', tableId) === 'desc' && self.isTrue(self.getLsItem('refreshed', tableId)) === true) {
                self.updateLocalStorage('dir', 'desc', tableId);
                return 'desc';
            } else if (self.getLsItem('dir', tableId) === 'desc' && self.isTrue(self.getLsItem('refreshed', tableId)) === false) {
                self.updateLocalStorage('dir', 'asc', tableId);
                return 'asc';
            }
        } else {
            self.updateLocalStorage('dir', 'asc', tableId);
            return 'asc';
        }
    };
   /**
     * Method used to accuate sorting based on column selected
     * @param {type} object
     * @param {type} tableId
     * @returns {undefined}
     */
    this.sortColumn = function (object, tableId) {

        if($.isEmptyObject(object)){
            return;
        }
        var $tbody = $('#' + tableId + ' tbody');
        if (self.trackColumnSort(tableId) === 'asc') {
            $tbody.find('tr').sort(function (a, b) {
                var tda = self.transformNumber($(a).find('td:eq(' + object.cellIndex + ')').text());
                var tdb = self.transformNumber($(b).find('td:eq(' + object.cellIndex + ')').text());
                // if a < b return 1
                return (tda).toLowerCase() > (tdb).toLowerCase() ? 1
                        // else if a > b return -1
                        : (tda).toLowerCase() < (tdb).toLowerCase() ? -1
                        // else they are equal - return 0    
                        : 0;
            }).appendTo($tbody);
            $(object).parent().find('span').addClass('dt-sort-icon-bg').removeClass('dt-sort-icon-desc').removeClass('dt-sort-icon-asc');
            $(object).find('span').addClass('dt-sort-icon-asc').removeClass('dt-sort-icon-desc').removeClass('dt-sort-icon-bg');
        } else {//if (self.trackColumnSort() === 'desc'){
            $tbody.find('tr').sort(function (a, b) {
                var tda = self.transformNumber($(a).find('td:eq(' + object.cellIndex + ')').text());
                var tdb = self.transformNumber($(b).find('td:eq(' + object.cellIndex + ')').text());
                // if a < b return 1
                return (tda).toLowerCase() < (tdb).toLowerCase() ? 1
                        // else if a > b return -1
                        : (tda).toLowerCase() > (tdb).toLowerCase() ? -1
                        // else they are equal - return 0    
                        : 0;
            }).appendTo($tbody);
            $(object).parent().find('span').addClass('dt-sort-icon-bg').removeClass('dt-sort-icon-desc').removeClass('dt-sort-icon-asc');
            $(object).find('span').addClass('dt-sort-icon-desc').removeClass('dt-sort-icon-asc').removeClass('dt-sort-icon-bg');
        }

        this.updateLocalStorage("columnClicked", object.cellIndex, tableId);
    };

    /**
     * Utiltiy method used by sorting of tag elements.  If text is a number, 
     * then it is prepended with 0's to make it easier in using alpha sort.
     * Prepending goes up to supposed support of 100,000; not sure if browser 
     * sorting and filtering would work at 100000 records.
     * @param {type} text - Usually a number for evaluation and padding to number
     * @returns {String} - a padded number like 00001 or 001238
     */
    this.transformNumber = function (text) {
        if (!isNaN(text)) {
            if (text.length < 6 && text.length > 4) { //only ##### ex: 099999
                text = "0" + text;
            } else if (text.length < 5 && text.length > 3) { //only #### ex: 009999
                text = "00" + text;
            } else if (text.length < 4 && text.length > 2) { //only ### ex: 000999
                text = "000" + text;
            } else if (text.length < 3 && text.length > 1) { //only ## ex: 000099
                text = "0000" + text;
            } else if (text.length < 2 && text.length > 0) { //only # ex: 000009
                text = "00000" + text;
            }
        }
        return text;
    }; 
    /**
     * Utility method used to determin if JSON object exist or not.
     * @param {type} obj - Obj could be anthing but in this usage is for JSON objects.
     * @returns {Boolean}
     */
    this.doesJsonExist = function (obj) {
        if (obj === null || obj === undefined) {
            return false;
        } else {
            return true;
        }
    };
    /**
     * Utility method that check both textual value of true and false as well 
     * as boolean values. This is because of the wierd response the browser takes
     * in return truth questions; sometimes responds in text and other times in 
     * boolean. This method handles the evaluation and simplifies the answer.
     * @param {type} eval - could be textual or boolean
     * @returns {Boolean}
     */
    this.isTrue = function (eval) {
        if (eval === 'true' || eval === 'True' || eval === 'TRUE' || eval === true) {
            return true;
        } else if (eval === 'false' || eval === 'False' || eval === 'FALSE' || eval === false) {
            return false;
        } else {
            return false;
        }
    };
}       
