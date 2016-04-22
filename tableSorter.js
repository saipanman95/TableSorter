/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




function TableSorter() {

    var self = this;
    this.columns = {};

    this.init = function (tableId) {
        self.getLocalStorage();
        $("head").append("<link rel='stylesheet' id='extracss' href='js/tableSorter/tableSorter.css' type='text/css' />");

        $("#" + tableId).wrapAll("<div class='dt-inner-div-" + tableId + " dt-inner-div'/>");
        $('.dt-inner-div-' + tableId).wrapAll("<div class='dt-table-wrapper-div-" + tableId + " dt-table-wrapper-div'/>");
        $('.dt-table-wrapper-div-' + tableId).prepend("<table class='dt-header-" + tableId + " dt-header'><thead id='dt-header-" + tableId + "'></thead></table>");
        $('.dt-table-wrapper-div-' + tableId).wrapAll("<div class='dt-outer-div-" + tableId + " dt-outer-div'/>");
        $('.dt-outer-div-' + tableId).before("<label for='dt-filter-id-" + tableId + "'>Filter List: </label><input id='dt-filter-id-" + tableId + "' type='text' class='dt-filter'/>");
        $('.dt-outer-div-' + tableId).before("<span style='padding-left: 15px;' id='dt-filter-txt'>...</span>");

        self.decorateHeaders('table#' + tableId, "#dt-header-" + tableId);

        $('#dt-header-' + tableId + ' tr th').click(function () {
            self.sortColumn(this, tableId);
        });

        self.calculateCellItems(tableId);

        $("#dt-filter-id-" + tableId).keyup(function () {
            var txt = $(this).val();
            if (txt.length > 0) {
                $('#dt-filter-txt').text(txt);
                self.filterRows(txt);
            } else {
                $('#dt-filter-txt').text('...');
                self.filterRows(txt);
            }
            self.calculateCellItems(tableId);
        });
    };

    this.updateLocalStorage = function (key, value) {
        localStorage.setItem(key, value);
    };

    this.getLocalStorage = function (key) {
        return localStorage.getItem(key);
    };

    this.decorateHeaders = function (tableHeaderIdentifier, dtheader) {

        $(tableHeaderIdentifier + " thead tr th").append("<span class='dt-sort-icon-bg'> </span>");

        $(dtheader).html($(tableHeaderIdentifier + " thead").html());

        $(dtheader + " tr th").hover(function () {
            $(this).addClass('hover-text-color');
        }, function () {
            $(this).removeClass('hover-text-color');
        });
        $(tableHeaderIdentifier + " thead").html("");
    };

    this.calculateCellItems = function (tableId) {
        var rows = $('#' + tableId + ' tbody tr');
        for (var r in rows) {
            if (!isNaN(r)) {
                var className = rows[r].className;
                if (className.indexOf("hidden-row") === -1) {
                    singleRow = rows[r];
                    //console.log("did not find hidden-row");
                }
            }
        }
        var cells = singleRow.cells;
        var tdWidthArr = new Array();
        for (var c in cells) {
            if (!isNaN(c)) {
                tdWidthArr[c] = $(cells[c]).width();
            }
        }
        var ths = $("#dt-header-" + tableId + " tr")[0].cells;
        for (var t in ths) {
            if (!isNaN(t)) {
                $(ths[t]).width(tdWidthArr[t]);
            }
        }
    };

    this.filterRows = function (filterText) {
        var rowArray = this.convertRowsToArray('table.dt > tbody > tr');
        var thisNewArray = this.createTempTables(rowArray);
        var newArray = new Array();
        for (var tbl in thisNewArray) {
            var thisTbl = thisNewArray[tbl];
            var tds = $(thisTbl).find("td");
            var rawRowTxt = "";
            for (var i = 0; i < tds.length; i++) {
                var td = tds[i];
                rawRowTxt = rawRowTxt + td.innerHTML;
            }
            if (rawRowTxt.toLowerCase().indexOf(filterText.toLowerCase()) === -1) {
                $(thisTbl).find("tr").addClass('hidden-row');
            } else {
                $(thisTbl).find("tr").removeClass('hidden-row');
            }
            newArray[tbl] = thisTbl.outerHTML;
        }

        var finalArray = this.transformTblRows(newArray);

        this.rebuildTable("table.dt tbody", finalArray);
        this.updateLocalStorage("filterText", filterText);
    };

    this.trackColumnSort = function (column) {
        if (self.columns[column]) {
            if (self.columns[column] === 'asc') {
                self.columns[column] = 'desc';
                return 'desc';
            } else if (self.columns[column] === 'desc') {
                self.columns[column] = 'asc';
                return 'asc';
            }
        } else {
            self.columns[column] = 'asc';
            return 'asc';
        }
    };

    this.sortColumn = function (object, tableId) {

        var rowArray = this.convertRowsToArray('table#' + tableId + ' > tbody > tr');

        var newArray = this.sortAscDesc(rowArray, object);

        var finalArray = this.transformTblRows(newArray);

        this.rebuildTable('table#' + tableId + ' > tbody', finalArray);
        this.updateLocalStorage("rowClicked", object.cellIndex);
    };

    this.convertRowsToArray = function (identifier) {
        var arr = new Array();
        $(identifier).each(function (index) {
            arr[index] = this.outerHTML;
        });
        return arr;
    };

    this.tagElements = function (elementArray, column) {
        var index = column + 1;
        var tempArray = new Array();

        for (var item in elementArray) {
            var tempDiv = document.createElement('table');
            tempDiv.innerHTML = elementArray[item];
            var col = $(tempDiv).find("tbody tr td:nth-child(" + index + ")");

            var text = $(col).html();
            $(tempDiv).attr("data-sort-value", this.transformNumber(text));
            $(tempDiv).find("tr").attr("data-sort-value", this.transformNumber(text));
            tempArray[item] = tempDiv.outerHTML;
        }

        return tempArray;
    };

    this.sortAscDesc = function (arr, obj) {

        var thisNewArray = self.tagElements(arr, obj.cellIndex);

        if (self.trackColumnSort(obj.cellIndex) === 'asc') {
            thisNewArray.sort();
            $(obj).parent().find('span').addClass('dt-sort-icon-bg').removeClass('dt-sort-icon-desc').removeClass('dt-sort-icon-asc');
            $(obj).find('span').addClass('dt-sort-icon-asc').removeClass('dt-sort-icon-desc').removeClass('dt-sort-icon-bg');
        } else {
            thisNewArray.reverse();
            $(obj).parent().find('span').addClass('dt-sort-icon-bg').removeClass('dt-sort-icon-desc').removeClass('dt-sort-icon-asc');
            $(obj).find('span').addClass('dt-sort-icon-desc').removeClass('dt-sort-icon-asc').removeClass('dt-sort-icon-bg');
        }
        return thisNewArray;
    };

    this.transformTblRows = function (initArray) {
        var endingArray = new Array();
        for (var it in initArray) {
            var tempDiv = document.createElement("div");
            tempDiv.innerHTML = initArray[it];
            var rowElement = $(tempDiv).find("table > tbody");
            endingArray[it] = rowElement[0].innerHTML;
        }
        return endingArray;
    };

    this.rebuildTable = function (tableIdentifier, rowsArray) {
        var combindedRows = rowsArray.join(" ");
        $(tableIdentifier).html(combindedRows);
    };

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

    this.createTempTables = function (elementArray) {
        var tblArray = new Array();
        for (var item in elementArray) {
            var tempDiv = document.createElement('table');
            tempDiv.innerHTML = elementArray[item];
            tblArray[item] = tempDiv;
        }
        return tblArray;

    };
}       