
// import fs from 'fs';
// import path from 'path';

// const FIELD_IMPORT_EXPORT_REG = /^(import|export) .*;$/g;
const FIELD_BRACE_REG = /\{(.*?)\}/;

async function getExcludes (objs, excludes) {
    let modules = [];
    for (let i = 0; i < objs.length; ++i) {
        let obj = objs[i];
        let splitArr = obj.split('*/');
        if (splitArr.length > 1) {
            obj = splitArr[1];
        }
        if (obj.indexOf('import ') === -1 && obj.indexOf('export ') === -1) {
            continue;
        }
        if (obj.indexOf('export class ') !== -1 ||
            obj.indexOf('export abstract ') !== -1 ||
            obj.indexOf('export function ') !== -1 ||
            obj.indexOf('export interface ') !== -1 ||
            obj.indexOf('export enum ') !== -1 ||
            obj.indexOf('export default ') !== -1) {
            continue;
        }
        for (let i = 0; i < excludes.length; ++i) {
            if (obj.toLowerCase().indexOf(excludes[i]) > -1) {
                modules.push(obj);
                break;
            }
        }
    }
    return modules;
}

export default function excludes (options = {modules: []}) {
    let exclude_modules = options.modules || [];

    return {
        name: 'excludes',

        async transform(code, id) {
            if (exclude_modules.length === 0) {
                return;
            }

            //-- 分割 Copyright 提示
            let splitArr = code.split('*/');
            let tempCode = splitArr.length > 1 ? splitArr[1] : code;
            //-- 剔除 export { foo, bar, file } 这种类型的模块
            splitArr = tempCode.split(';');
            let tempField = await getExcludes(splitArr, exclude_modules);
            let moduleNames = [];
            for (let i = 0; i < tempField.length; ++i) {
                let result = FIELD_BRACE_REG.exec(tempField[i]);
                if (result) {
                    let tempSplitArr = result[1].split(',');
                    moduleNames = await getExcludes(tempSplitArr, exclude_modules);
                }
            }
            
            for (let i = 0; i < moduleNames.length; ++i) {
                code = code.replace(new RegExp(`${moduleNames[i].trim()},`, 'g'), '');
            }

            //-- 剔除 import/export 的模块
            splitArr = code.split(';');
            tempField = await getExcludes(splitArr, exclude_modules);
            for (let i = 0; i < tempField.length; ++i) {
                code = code.replace(`${tempField[i]};`, '');
            }

            return {
                code: code,
            }
        }
    };
}
