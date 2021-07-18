/**
 * @file Locale system
 * @description Functions for locale and string parsing
 */

import type { HibikiClient } from "./Client";
import type { LocaleString, LocaleStrings } from "../typings/locales";

import { logger } from "../utils/logger";

import { readFile, readdir } from "fs";

import config from "../../config.json";

export class LocaleSystem {
  readonly bot: HibikiClient;
  readonly locales: Record<string, string> = {};

  constructor(bot: HibikiClient, path: string) {
    this.bot = bot;
    this.updateLocales(path);
  }

  updateLocales(path: string) {
    // Reads the locales directory
    readdir(path, { withFileTypes: true }, (err, files) => {
      if (err) throw err;

      // Loads each locale
      files.forEach((file) => {
        if (file.isDirectory()) this.updateLocales(`${path}/${file.name}`);
        else if (file.isFile()) {
          readFile(`${path}/${file.name}`, { encoding: "utf8" }, (_err, fileData) => {
            if (err) throw err;
            const localeObj = {};
            const data = JSON.parse(fileData);

            // Parses each individual locale
            Object.entries(data).forEach((locale) => {
              // If the locale exists
              if (typeof locale[1] === "object") {
                localeObj[locale[0]] = {};
                Object.entries(locale[1]).forEach((string) => {
                  if (string[1].length > 0) localeObj[locale[0]][string[0]] = string[1];
                });
              } else {
                // Replaces empty strings
                localeObj[locale[0]] = locale[1];
              }
            });

            this.locales[file.name.replace(/.json/, "")] = localeObj as string;
          });
        }
      });
    });
  }

  // Returns a string from a specific locale
  getLocale(language: string, fieldName: LocaleStrings, args?: { [x: string]: any } | undefined): string {
    // Gets the string category
    const category = fieldName.split(".");
    let output = "";

    output = this._findLocaleString(language, fieldName, category);

    // Search for the default entry if the string doesn't exist, sends a warning each time no entry is found
    if (!output) {
      const defaultLocale = config.defaultLocale ?? "en";
      const isDefault = language === defaultLocale;
      if (language)
        logger.warn(
          `${fieldName} is missing in the string table for ${language}${!isDefault ? ", searching in default locale string table" : ""}`,
        );
      return isDefault ? (fieldName as string) : this.getLocale(defaultLocale, fieldName, args);
    }

    // Passes arguments to the string
    if (args) {
      Object.getOwnPropertyNames(args).forEach((arg) => {
        // Handles plurals/non-plural and arguments/optionals
        const argumentRegex = new RegExp(`{${arg}}`);
        const pluralRegex = new RegExp(`{${arg}:#([^{}]+)#!([^{}]+)!(?:\\?([^{}]+)\\?)?}`);
        const optionalRegex = new RegExp(`({optional:${arg}:(.+)(?:{\\w})?})`);

        // Replaces optional strings with content
        const optional = optionalRegex.exec(output);
        if (optional) output = output.replace(optional[1], typeof args[arg] != "undefined" ? optional[2] : "");
        output = output.replace(argumentRegex, args[arg]);

        // Handles plurals
        const plurals = pluralRegex.exec(output);

        // Sends the output with the correct grammar
        if (plurals) {
          let plural = "";
          if (args[arg] === 1 || (args[arg] > 1 && args[arg] < 2)) plural = plurals[2];
          else if (plurals[3] && args[arg] >= 2 && args[arg] <= 4) plural = plurals[3];
          else plural = plurals[1];

          output = output.replace(plurals[0], plural);
        } else if (!plurals) output = output.replace(`{${arg}}`, args[arg]);
      });
    }

    // Handles optional input
    const optionalRegex = new RegExp(`({optional:.+:(.+)})`);
    const optional = optionalRegex.exec(output);
    if (optional) output = output.replace(optional[1], "");
    return output;
  }

  // Runs the function to return a locale string
  getLocaleFunction(language: string): LocaleString {
    return (fieldName: LocaleStrings, args?: Record<string, unknown>) => this.getLocale(language, fieldName, args);
  }

  // Returns what locale a user uses
  async getUserLocale(user: string, handler = false) {
    let locale = "";
    const userConfig = await this.bot.db.getUserConfig(user);
    if (userConfig?.locale) locale = userConfig.locale;
    else if (handler === false) locale = config.defaultLocale ? config.defaultLocale : "en";

    return locale;
  }

  private _findLocaleString(language: string, fieldName: string, category: string[]) {
    if (!this.locales?.[language]) return;
    let output = "";

    // Attempts to find the string if the category isn't provided
    if (!this.locales?.[language]?.[category[0]] && !this.locales?.[fieldName]) {
      Object.getOwnPropertyNames(this.locales[language]).forEach((cat) => {
        Object.getOwnPropertyNames(this.locales[language][cat]).forEach((locale) => {
          if (locale === fieldName) output = this.locales[language][cat][locale];
        });
      });

      // Sets the output if the category exists
    } else if (this.locales?.[language]?.[category[0]] && this.locales?.[language]?.[category[0]]?.[category[1]]) {
      output = this.locales[language][category[0]][category[1]];
      // Sets the locale if no category exists
    } else if (this.locales?.[language]?.[fieldName]) {
      output = this.locales[language][fieldName];
    }

    return output;
  }
}
