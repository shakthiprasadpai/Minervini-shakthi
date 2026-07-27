declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl?: string;
  description?: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

export const loadGooglePickerApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.picker) {
      resolve();
      return;
    }

    const loadGapiPicker = () => {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => {
            if (window.google?.picker) {
              resolve();
            } else {
              reject(new Error('Google Picker API failed to initialize.'));
            }
          },
          onerror: () => reject(new Error('Failed to load Google Picker via gapi.load.')),
        });
      } else {
        reject(new Error('Google API script (gapi) is not available.'));
      }
    };

    if (window.gapi) {
      loadGapiPicker();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = loadGapiPicker;
      script.onerror = () => reject(new Error('Failed to load Google API script from apis.google.com.'));
      document.body.appendChild(script);
    }
  });
};

export const openGooglePicker = async ({
  accessToken,
  viewType = 'SPREADSHEETS',
  onFilePicked,
  onCancel,
}: {
  accessToken: string;
  viewType?: 'SPREADSHEETS' | 'DOCS' | 'ALL';
  onFilePicked: (file: PickedFile) => void;
  onCancel?: () => void;
}) => {
  await loadGooglePickerApi();

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  let view: any;
  if (viewType === 'SPREADSHEETS') {
    view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS);
  } else if (viewType === 'DOCS') {
    view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
  } else {
    view = new window.google.picker.DocsView();
  }

  const pickerBuilder = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin)
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        if (doc) {
          onFilePicked({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url || doc.embedUrl || `https://docs.google.com/spreadsheets/d/${doc.id}/edit`,
            iconUrl: doc.iconUrl,
            description: doc.description,
            sizeBytes: doc.sizeBytes,
            lastEditedUtc: doc.lastEditedUtc,
          });
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    });

  const picker = pickerBuilder.build();
  picker.setVisible(true);
};
