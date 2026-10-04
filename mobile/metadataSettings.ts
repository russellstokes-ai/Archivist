export type MetadataSettings={
  onlineEnabled:boolean;
  automaticEnrichment:boolean;
  applyHighConfidence:boolean;
  books:{
    enabled:boolean;
    openLibrary:boolean;
    googleBooks:boolean;
  };
  comics:{
    enabled:boolean;
    metron:boolean;
  };
};

export const defaultMetadataSettings:MetadataSettings={
  onlineEnabled:true,
  automaticEnrichment:true,
  applyHighConfidence:true,
  books:{enabled:true,openLibrary:true,googleBooks:false},
  comics:{enabled:true,metron:true},
};

export function sanitizeMetadataSettings(value:unknown):MetadataSettings{
  const raw=value&&typeof value==='object'?value as any:{};
  const books=raw.books&&typeof raw.books==='object'?raw.books:{};
  const comics=raw.comics&&typeof raw.comics==='object'?raw.comics:{};
  return {
    onlineEnabled:raw.onlineEnabled===undefined?defaultMetadataSettings.onlineEnabled:!!raw.onlineEnabled,
    automaticEnrichment:raw.automaticEnrichment===undefined?defaultMetadataSettings.automaticEnrichment:!!raw.automaticEnrichment,
    applyHighConfidence:raw.applyHighConfidence===undefined?defaultMetadataSettings.applyHighConfidence:!!raw.applyHighConfidence,
    books:{
      enabled:books.enabled===undefined?defaultMetadataSettings.books.enabled:!!books.enabled,
      openLibrary:books.openLibrary===undefined?defaultMetadataSettings.books.openLibrary:!!books.openLibrary,
      googleBooks:books.googleBooks===undefined?defaultMetadataSettings.books.googleBooks:!!books.googleBooks,
    },
    comics:{
      enabled:comics.enabled===undefined?defaultMetadataSettings.comics.enabled:!!comics.enabled,
      metron:comics.metron===undefined?defaultMetadataSettings.comics.metron:!!comics.metron,
    },
  };
}

export function metadataProvidersEnabled(settings:MetadataSettings){
  return {
    books:settings.onlineEnabled&&settings.books.enabled&&(settings.books.openLibrary||settings.books.googleBooks),
    comics:settings.onlineEnabled&&settings.comics.enabled&&settings.comics.metron,
  };
}
