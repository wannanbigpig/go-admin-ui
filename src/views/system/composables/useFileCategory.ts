import { ref } from 'vue'

export const CATEGORY_FILE_TYPE_MAP: Record<string, string> = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    document: 'pdf,word,excel,ppt,text',
    archive: 'archive',
    other: 'other',
}

export interface UseFileCategoryOptions {
    onSelect: (category: string, fileType: string | null) => void
}

export function useFileCategory(options: UseFileCategoryOptions) {
    const selectedCategory = ref('all')

    const selectCategory = (category: string) => {
        selectedCategory.value = category
        const fileType = category === 'all' ? null : (CATEGORY_FILE_TYPE_MAP[category] ?? category)
        options.onSelect(category, fileType)
    }

    return {
        selectedCategory,
        selectCategory,
    }
}
