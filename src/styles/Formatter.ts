import _ from "lodash";

const minorWords = [
    // from APA style guide https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case
    'and', 'as', 'but', 'for', 'if', 'nor', 'or', 'so', 'yet',
    'a', 'an', 'the',
    'as', 'at', 'by', 'for', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via',
    // extras that I added
    'with', 'without', 'minus', 'plus'

]

export const formatMealName = (name?: string|null) => {
    if (!name) return '';
    return name
        .split(/\s/) // split by all whitespace
        .filter((part) => !_.isEmpty(part))
        .map((part, index) => {
            if (index !== 0 && minorWords.includes(part)) {
                return part;
            }
            if (/\d+\w*/.test(part)) {
                return part;
            }
            const [firstChar, ...rest] = part;
            // uppercase first letter then lowercase the rest.
            return `${firstChar.toLocaleUpperCase()}${rest.join('').toLocaleLowerCase()}`;
        }).join(' ');
}