const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const mongoose = require('mongoose');

async function start() {
    const halltickets = ["094205010001", "094205010002","094205010003","094205010004","094205010005","094205010006"];
    mongoose.connect('mongodb://127.0.0.1:27017/scores');    
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    for (let i=0;i<halltickets.length;i++){
        const data = await loadAndExtractData(halltickets[i], page);
        await saveToMongoDb(data);
    }

    await browser.close();
}

const Score = mongoose.model('Score', {
    hallticketNumber: String,
    studentName: String,
    code: String,
    subject: String,
    marks: String,
    grade: String,
});

async function saveToMongoDb(data) {
    for (let i = 0; i < data.codes.length; i++) {
        const code = data.codes[i];
        const subject = data.subject[i];
        const subjectMarks = data.subjectMarks[i];
        const subjectGrades = data.subjectGrades[i];
        const score = new Score({
            hallticketNumber: data.hallticketNumber.trim(),
            studentName: data.studentName.trim(),
            code: code.trim(),
            subject: subject.trim(),
            marks: subjectMarks.trim(),
            grade: subjectGrades.trim(),
        });
        await score.save();
        console.log("saved");
    } 
    console.log(data);
    
}

async function loadAndExtractData(hallticketNumber, page) {
    console.log('going to page...');
    await page.goto("https://www.osmania.ac.in/res07/20220711.jsp");
    console.log('page loaded');
    // await page.screenshot({ path: 'example2..png' });
    const ht = await page.waitForXPath(`//*[@id="AutoNumber6"]/tbody/tr[1]/td/b/font/input[1]`);
    await ht.click();
    await ht.type(hallticketNumber);
    const submit = await page.waitForSelector(`input[type=image]`);
    await Promise.all([
        submit.click(),
        page.waitForNavigation({waitUntil: 'networkidle2'})
    ]);
    // await someTime(5 * 60);
    const trs3 = await page.$$('#AutoNumber3 > tbody > tr'); // student name
    const trs4 = await page.$$('#AutoNumber4 > tbody > tr'); // marks
    const studentName = await extractName(trs3, page);
    // console.log('hall ticket number is ' + hallticketNumber)
    // console.log("student name is " + studentName);
    const codes = await printTrContent(trs4, page);
    // console.log("codes is " + codes);
    const subject= await printSubject(trs4,page)
    // console.log("Subjects are " + subject);
    const subjectMarks= await printSubjectMarks(trs4,page);
    // console.log("Subject Marks are  " + subjectMarks);
    const subjectGrades= await printSubjectGrades(trs4,page);
    // console.log("Subject Grades are  " + subjectGrades);

    return {
        hallticketNumber: hallticketNumber,
        studentName: studentName,
        codes: codes,
        subject: subject,
        subjectMarks: subjectMarks,
        subjectGrades: subjectGrades,
    };
}

async function extractName(listOfTrs, page) {
    // console.log("***********************printing tr contents***********************");
    for (let j = 0; j < listOfTrs.length; j++) {
        const resultTableTr = listOfTrs[j];
        const listOfTds = await resultTableTr.$$("td");

        if (j === 2) {            
            for (let i = 0; i < listOfTds.length; i++) {
                const text = await page.evaluate(el => el.textContent, listOfTds[i]);
                if (i === 1) {
                    return text;
                }
            }
        }
    }
}

async function printSubject(listOfTrs, page) {
    const subject = [];


    for (let j = 0; j < listOfTrs.length; j++) {
        const resultTableTr = listOfTrs[j];
        const listOfTds = await resultTableTr.$$("td");

        for (let i = 0; i < listOfTds.length; i++) {
            const text = await page.evaluate(el => el.textContent, listOfTds[i]);
            
            if (i === 1 && j >= 2) {
                subject.push(text);
            }
        }
    }

    return subject;
}

async function printTrContent(listOfTrs, page) {
    const codes = [];

    // console.log("***********************printing tr contents***********************");
    for (let j = 0; j < listOfTrs.length; j++) {
        const resultTableTr = listOfTrs[j];
        const listOfTds = await resultTableTr.$$("td");
        // console.log("printing tr number ", j);

        for (let i = 0; i < listOfTds.length; i++) {
            const text = await page.evaluate(el => el.textContent, listOfTds[i]);
            // console.log("printing td number " + i + " text is " + text);
            if (i === 0 && j >= 2) {
                codes.push(text);
            }
        }
    }

    return codes;
}


async function printSubjectMarks(listOfTrs, page) {
    const subjectMarks = [];


    for (let j = 0; j < listOfTrs.length; j++) {
        const resultTableTr = listOfTrs[j];
        const listOfTds = await resultTableTr.$$("td");

        for (let i = 0; i < listOfTds.length; i++) {
            const text = await page.evaluate(el => el.textContent, listOfTds[i]);
            
            if (i === 2 && j >= 2) {
                subjectMarks.push(text);
            }
        }
    }

    return subjectMarks;
}

async function printSubjectGrades(listOfTrs, page) {
    const subjectGrades = [];


    for (let j = 0; j < listOfTrs.length; j++) {
        const resultTableTr = listOfTrs[j];
        const listOfTds = await resultTableTr.$$("td");

        for (let i = 0; i < listOfTds.length; i++) {
            const text = await page.evaluate(el => el.textContent, listOfTds[i]);
            
            if (i === 4 && j >= 2) {
                subjectGrades.push(text);
            }
        }
    }

    return subjectGrades;
}
start();

function someTime(seconds) {
    return new Promise(res => setTimeout(res, seconds * 1000));
}