async function printTrContent(listOfTrs, page) {
    console.log("***********************printing tr contents***********************");
    for (let j = 0; j < listOfTrs.length; j++) {
        const resultTableTr = listOfTrs[j];
        const listOfTds = await resultTableTr.$$("td");
        console.log("printing tr number ", j);

        for (let i = 0; i < listOfTds.length; i++) {
            const text = await page.evaluate(el => el.textContent, listOfTds[i]);
            console.log("printing td number " + i + " text is " + text);
        }
    }
}