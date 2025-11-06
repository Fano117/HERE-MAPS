declare namespace H {
  namespace service {
    class Platform {
      constructor(options: { apikey: string });
      getSearchService(): any;
      createDefaultLayers(): any;
    }
  }

  class Map {
    constructor(container: HTMLElement, defaultLayer: any, options: {
      zoom: number;
      center: { lat: number; lng: number };
    });
    
    addEventListener(event: string, callback: (evt: any) => void): void;
    screenToGeo(x: number, y: number): { lat: number; lng: number };
    addObject(object: any): void;
    removeObject(object: any): void;
    setCenter(center: { lat: number; lng: number }): void;
    setZoom(zoom: number): void;
  }

  namespace map {
    class Marker {
      constructor(coordinates: { lat: number; lng: number }, options?: any);
    }

    class Icon {
      constructor(data: string, options: { size: { w: number; h: number } });
    }
  }

  namespace mapevents {
    class Behavior {
      constructor();
    }
  }

  namespace ui {
    class UI {
      static createDefault(map: any): any;
    }
  }
}
