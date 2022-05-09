export interface Store {
  custom_url: {
    is_customized: boolean;
    url: string;
  };
  id: number;
  image_url: string;
  meta_description: string;
  meta_keywords: string[];
  name: number;
  page_title: string;
  search_keywords: string;
}

// {
//     "custom_url": {
//       "is_customized": false,
//       "url": "/2002/"
//     },
//     "id": 514,
//     "image_url": "",
//     "meta_description": "",
//     "meta_keywords": [
//       ""
//     ],
//     "name": "2002",
//     "page_title": "",
//     "search_keywords": ""
//   },
