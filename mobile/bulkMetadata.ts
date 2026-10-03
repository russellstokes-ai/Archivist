import {LocalBook, LocalMetadataOverride} from './localLibrary';

export type BulkMetadataPatch = {
  author?: string;
  series?: string;
  genre?: string;
  narrator?: string;
};

export function bulkOverrideForBook(
  book: LocalBook,
  workTitle: string,
  patch: BulkMetadataPatch,
  seriesNumber?: number,
): LocalMetadataOverride {
  return {
    title: workTitle || book.title,
    author: patch.author === undefined ? book.author : patch.author,
    series: patch.series === undefined ? book.series : patch.series,
    seriesNumber: seriesNumber === undefined ? book.seriesNumber : seriesNumber,
    genre: patch.genre === undefined ? book.genre : patch.genre,
    publishedYear: book.publishedYear,
    narrator: patch.narrator === undefined ? book.narrator : patch.narrator,
    publisher: book.publisher,
    isbn: book.isbn,
    asin: book.asin,
    language: book.language,
    description: book.description,
    coverUri: book.coverUri,
  };
}

export function sequentialSeriesNumbers<T>(items:T[],start=1) {
  const safe=Number.isFinite(start)?start:1;
  return items.map((item,index)=>({item,seriesNumber:safe+index}));
}
