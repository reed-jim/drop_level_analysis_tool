'use client'

import { Button, Divider, Typography } from "@mui/material";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useState } from "react";
import Papa from "papaparse";
import { mkConfig, generateCsv, asBlob } from "export-to-csv";

function componentToHex(c) {
    var hex = Math.round(c).toString(16);

    return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const getGradientColorHex = (startColor, endColor, ratio) => {
    return rgbToHex(
        (1 - ratio) * startColor[0] + ratio * endColor[0],
        (1 - ratio) * startColor[1] + ratio * endColor[1],
        (1 - ratio) * startColor[2] + ratio * endColor[2],
    )
}

const importCSV = (data) => {
    // let csvContent = "data:text/csv;charset=utf-8,";

    // data.forEach(rowArray => {
    //     // let row = rowArray.join(",");
    //     csvContent += rowArray + "\r\n";
    // });

    console.log(data);

    var blob = new Blob(data, { type: 'text/csv;charset=utf-8;' });

    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "drop_level.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function exportToCsv(data) {
    const csvConfig = mkConfig({ useKeysAsHeaders: true });

    const csv = generateCsv(csvConfig)(data);

    const blob = asBlob(csvConfig)(csv);

    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "drop_level.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export default function Home() {
    var exportCsvContent;

    const [csvData, setData] = useState({});
    // const [exportCsvContent, setExportCsvContent] = useState({});

    const readCSV = (event) => {
        Papa.parse(
            event.target.files[0],
            {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log(results);
                    setData(results.data);
                }
            }
        )
    }

    const displayData = () => {
        if (Object.keys(csvData).length == 0) {
            return <Typography>No Data</Typography>
        }

        var isFoundLevelData = false;
        var isEnd = false;
        var numberUserStartLevels = [];

        csvData.forEach(element => {
            var firstKey = Object.keys(element)[0]
            var secondKey = Object.keys(element)[1]

            if (isFoundLevelData == false) {
                if (element[firstKey] == "level_1") {
                    // console.log(element[firstKey]);
                    // console.log(element[secondKey][1]);

                    isFoundLevelData = true;
                }
            }
            else {
                if (element[secondKey] != undefined) {
                    if (element[secondKey][1] == "Total users") {
                        isEnd = true;
                    }

                    if (isEnd == false) {
                        numberUserStartLevels.push(element[secondKey][1]);
                    }
                }
            }
        });

        var dropPercents = [];
        var remainingPercents = [1];
        const numberStartUser = numberUserStartLevels[0];

        numberUserStartLevels.map(
            (element, index) => {
                if (index + 1 < numberUserStartLevels.length) {
                    var dropPercent = ((numberUserStartLevels[index] - numberUserStartLevels[index + 1]) / numberStartUser).toFixed(2);

                    dropPercents.push(dropPercent)
                }
            }
        )

        for (let i = 1; i < numberUserStartLevels.length; i++) {
            var remainingPercent = ((remainingPercents[i - 1] - dropPercents[i - 1])).toFixed(2);

            remainingPercents.push(remainingPercent)
        }

        const maxDropPercent = Math.max.apply(Math, dropPercents);
        const minRemainingPercent = Math.min.apply(Math, remainingPercents);

        const levels = numberUserStartLevels.map(
            (element, index) =>
                <div key={index} style={{ padding: "0px" }}>
                    <div style={{ display: "flex", columnGap: "160px" }}>
                        {/* <Typography key={index}>
                            {`${numberUserStartLevels[index]}  -  ${parseFloat(dropPercents[index]).toFixed(2)}%  -  ${parseFloat(remainingPercents[index]).toFixed(2)}%`}
                        </Typography> */}

                        <Typography style={{ minWidth: "160px" }}>
                            {`Level ${index}`}
                        </Typography>

                        <Typography style={{ minWidth: "160px" }}>
                            {`${numberUserStartLevels[index]}`}
                        </Typography>

                        <Typography
                            align="center"
                            style={{ minWidth: "160px", backgroundColor: getGradientColorHex([255, 255, 255], [255, 0, 0], dropPercents[index] / maxDropPercent) }} padding={"4px"}
                        >
                            {index == numberUserStartLevels.length - 1 ? "" : `${parseFloat(dropPercents[index] * 100).toFixed(2)}%`}
                        </Typography>

                        <Typography
                            align="center"
                            style={{ minWidth: "160px", backgroundColor: getGradientColorHex([255, 255, 255], [0, 160, 50], (remainingPercents[index] - minRemainingPercent) / 1) }} padding={"4px"}
                        >
                            {`${parseFloat(remainingPercents[index] * 100).toFixed(2)}%`}
                        </Typography>
                    </div>

                    {/* <Divider></Divider> */}
                </div>
        )

        // EXPORT CSV
        var csvContent = [];

        for (let i = 1; i < numberUserStartLevels.length; i++) {
            var row = {
                level: `level ${i}`,
                numberUser: numberUserStartLevels[i],
                dropPercent: dropPercents[i],
                remainingPercents: remainingPercents[i]
            }

            csvContent.push(row)
        }

        exportCsvContent = csvContent
        //

        return <div style={{ padding: "16px" }}>{levels}</div>
    }

    return (
        <div>
            <div style={{ display: "flex", columnGap: "40px" }}>
                <input
                    type="file"
                    name="Upload CSV File"
                    accept=".csv"
                    onChange={readCSV}
                />

                <Button onClick={() => exportToCsv(exportCsvContent)}>
                    Download
                </Button>
            </div>

            {displayData()}
        </div>
    );

    // const displayGridData = () => {
    //     if (Object.keys(csvData).length == 0) {
    //         return <Typography>No Data</Typography>
    //     }

    //     var isFoundLevelData = false;
    //     var isEnd = false;
    //     var numberUserStartLevels = [];

    //     csvData.forEach(element => {
    //         var firstKey = Object.keys(element)[0]
    //         var secondKey = Object.keys(element)[1]

    //         if (isFoundLevelData == false) {
    //             if (element[firstKey] == "level_1") {
    //                 // console.log(element[firstKey]);
    //                 // console.log(element[secondKey][1]);

    //                 isFoundLevelData = true;
    //             }
    //         }
    //         else {
    //             if (element[secondKey] != undefined) {
    //                 if (element[secondKey][1] == "Total users") {
    //                     isEnd = true;
    //                 }

    //                 if (isEnd == false) {
    //                     numberUserStartLevels.push(element[secondKey][1]);
    //                 }
    //             }
    //         }
    //     });

    //     var dropPercents = [];
    //     var remainingPercents = [100];
    //     const numberStartUser = numberUserStartLevels[0];

    //     numberUserStartLevels.map(
    //         (element, index) => {
    //             if (index + 1 < numberUserStartLevels.length) {
    //                 dropPercents.push((numberUserStartLevels[index] - numberUserStartLevels[index + 1]) / numberStartUser * 100)
    //             }
    //         }
    //     )

    //     for (let i = 1; i < numberUserStartLevels.length; i++) {
    //         remainingPercents.push((remainingPercents[i - 1] - dropPercents[i - 1]))
    //     }

    //     // const levels = numberUserStartLevels.map(
    //     //     (element, index) =>
    //     //         <Typography key={index}>
    //     //             {`${numberUserStartLevels[index]}  -  ${parseFloat(dropPercents[index]).toFixed(2)}%  -  ${parseFloat(remainingPercents[index]).toFixed(2)}%`}
    //     //         </Typography>
    //     // )

    //     const rows = [];

    //     const levels = numberUserStartLevels.map(
    //         (element, index) =>
    //             rows.push({
    //                 id: index,
    //                 userNumber: numberUserStartLevels[index],
    //                 dropPercent: index == numberUserStartLevels.length - 1 ? "" : `${parseFloat(dropPercents[index]).toFixed(2)}%`,
    //                 remainingPercent: `${parseFloat(remainingPercents[index]).toFixed(2)}%`
    //             })
    //     )

    //     const columns = [
    //         { field: 'userNumber', headerName: 'User Number', width: 200 },
    //         { field: 'dropPercent', headerName: 'Drop Percent', width: 200 },
    //         { field: 'remainingPercent', headerName: 'Remaining Percent', width: 200 },
    //     ];

    //     return <DataGrid
    //         columns={columns}
    //         rows={rows}
    //         initialState={{
    //             pagination: {
    //                 paginationModel: { page: 0, pageSize: 100 },
    //             },
    //         }}
    //     />
    // }
}
