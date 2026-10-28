// Synthetic gallery render cases (generated, no real data). One JSON file per batch.

import cases01 from "./cases-01.json";
import cases02 from "./cases-02.json";
import cases03 from "./cases-03.json";
import cases04 from "./cases-04.json";
import cases05 from "./cases-05.json";
import cases06 from "./cases-06.json";
import cases07 from "./cases-07.json";
import cases08 from "./cases-08.json";
import cases09 from "./cases-09.json";
import cases10 from "./cases-10.json";
import cases11 from "./cases-11.json";
import cases12 from "./cases-12.json";
import cases13 from "./cases-13.json";
import cases14 from "./cases-14.json";
import cases15 from "./cases-15.json";
import cases16 from "./cases-16.json";
import cases17 from "./cases-17.json";
import cases18 from "./cases-18.json";
import cases19 from "./cases-19.json";
import cases20 from "./cases-20.json";
import cases21 from "./cases-21.json";
import cases22 from "./cases-22.json";
import cases23 from "./cases-23.json";
import cases24 from "./cases-24.json";
import cases25 from "./cases-25.json";
import cases26 from "./cases-26.json";
import cases27 from "./cases-27.json";
import cases28 from "./cases-28.json";
import cases29 from "./cases-29.json";
import cases30 from "./cases-30.json";
import cases31 from "./cases-31.json";
import cases32 from "./cases-32.json";
import cases33 from "./cases-33.json";
import cases34 from "./cases-34.json";
import cases35 from "./cases-35.json";
import cases36 from "./cases-36.json";
import cases37 from "./cases-37.json";
import cases38 from "./cases-38.json";
import cases39 from "./cases-39.json";
import cases40 from "./cases-40.json";
import cases41 from "./cases-41.json";
import cases42 from "./cases-42.json";
import cases43 from "./cases-43.json";
import cases44 from "./cases-44.json";
import cases45 from "./cases-45.json";

export interface GalleryCase {
  title: string;
  imageCount: number;
  locale: string;
  expectedTitleHtml: string;
}

export interface GalleryCaseBatch {
  description: string;
  cases: GalleryCase[];
}

export const BATCHES: Record<string, GalleryCaseBatch> = {
  "cases-01": cases01,
  "cases-02": cases02,
  "cases-03": cases03,
  "cases-04": cases04,
  "cases-05": cases05,
  "cases-06": cases06,
  "cases-07": cases07,
  "cases-08": cases08,
  "cases-09": cases09,
  "cases-10": cases10,
  "cases-11": cases11,
  "cases-12": cases12,
  "cases-13": cases13,
  "cases-14": cases14,
  "cases-15": cases15,
  "cases-16": cases16,
  "cases-17": cases17,
  "cases-18": cases18,
  "cases-19": cases19,
  "cases-20": cases20,
  "cases-21": cases21,
  "cases-22": cases22,
  "cases-23": cases23,
  "cases-24": cases24,
  "cases-25": cases25,
  "cases-26": cases26,
  "cases-27": cases27,
  "cases-28": cases28,
  "cases-29": cases29,
  "cases-30": cases30,
  "cases-31": cases31,
  "cases-32": cases32,
  "cases-33": cases33,
  "cases-34": cases34,
  "cases-35": cases35,
  "cases-36": cases36,
  "cases-37": cases37,
  "cases-38": cases38,
  "cases-39": cases39,
  "cases-40": cases40,
  "cases-41": cases41,
  "cases-42": cases42,
  "cases-43": cases43,
  "cases-44": cases44,
  "cases-45": cases45,
};
