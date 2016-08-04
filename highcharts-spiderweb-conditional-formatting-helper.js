var addChartConditionalFormatting = (function() {

    // Main function that does all the work 
    // conditionalFormatting argument accepts two arguments - (value, index) and should return the color or its RGB or HEX representation
    return function(chart, conditionalFormatting) {

        if (!chart.polar) return;
        //Initial setup variables

        var series = chart.series[0].data,
            yAxis = chart.yAxis[0],
            // Get all the 'g' svg elements.
            // Group element at 0 stores the axis of the chart
            chartAxisGroup = chart.renderer.box.querySelector('g'),
            // If this function is called during the update - we want to use sectors we created before
            conditionalFormattingSectors = [].slice.call(chartAxisGroup.querySelectorAll('.conditional-formatting')),
            numberOfCreatedSectors = conditionalFormattingSectors.length,
            numberOfSectors = series.length;

        var webRadius = yAxis.height;

        var webCenter = getCenterCoords(chartAxisGroup.childNodes[numberOfCreatedSectors]);

        var sectorBorderCoords = [];
        for (var i = numberOfCreatedSectors; i < (numberOfCreatedSectors + numberOfSectors); i++) {
            sectorBorderCoords.push(getLineEndCoords(chartAxisGroup.childNodes[i]));
        }
        sectorBorderCoords = sortSectorsByPosition(webCenter, webRadius, sectorBorderCoords);

        var hasArc = yAxis.options.gridLineInterpolation == 'circle';

        for (var j = 0; j < numberOfSectors; j++) {
            // Use created sector or create a new one
            var sector = conditionalFormattingSectors.length ?
                conditionalFormattingSectors[j] :
                document.createElementNS("http://www.w3.org/2000/svg", 'path');
            sector.setAttribute('d', buildPath(sectorBorderCoords[j], (j == numberOfSectors - 1 ? sectorBorderCoords[0] : sectorBorderCoords[j + 1]), webCenter, hasArc, webRadius));
            sector.setAttribute('class', 'conditional-formatting');
            sector.setAttribute('fill', conditionalFormatting(Math.round(series[j].y * 100) / 100, j, series));
            chartAxisGroup.insertBefore(sector, chartAxisGroup.firstChild);
        }
    };


    // Get the center coords by parsing the "d" attribute of Line path
    function getCenterCoords(path) {
        var matcher = /M\s+(.+)\sL/g;
        var dAttrValue = path.getAttribute('d');
        var match = matcher.exec(dAttrValue);
        return match[1];
    }


    // Get the line end coords by parsing the "d" attribute of Line path
    function getLineEndCoords(path) {
        var matcher = /L\s+(.+)/g;
        var dAttrValue = path.getAttribute('d');
        var match = matcher.exec(dAttrValue);
        return match[1];
    }


    // Build the "d" attribute for the paths that we add to the beginning of the first g element of the chart
    // If the chart has circle interpolation - we use the Arc, otherwise a siple Line
    function buildPath(sectorStartCoord, sectorEndCoord, chartCenter, hasArc, arcRadius) {
        var pathStart = 'M ' + sectorStartCoord;
        var startEndConnection = (hasArc ?
            'A ' + arcRadius + ' ' + arcRadius + ' 0 0 1 ' + sectorEndCoord :
            'L ' + sectorEndCoord);
        var centerConnection = 'L ' + chartCenter;

        return [pathStart, startEndConnection, centerConnection].join(' ');
    }


    // SVG elements that represent the axes not always have the right order when displayed in the DOM
    // So use the coordinates of the top Y axis to find the starting item in the coordintes collection and
    // rearrange the array afterwards
    function sortSectorsByPosition(centerCoords, radius, sectorsCoords) {
        var centerY = parseFloat(centerCoords.split(' ')[1]);
        var firstSectorY = centerY - radius;
        var firstSectorStartIndex = 0;
        sectorsCoords.forEach(function(item, index) {
            if (item.split(' ')[1] == firstSectorY)
                firstSectorStartIndex = index;
        });

        return glueArrayFromIndex(sectorsCoords, firstSectorStartIndex);
    }


    // Helper function to split and concatenate the array at the given index
    function glueArrayFromIndex(array, index) {
        return array.slice(index).concat(array.slice(0, index));
    }

})();