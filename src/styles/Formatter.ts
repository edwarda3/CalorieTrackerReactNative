import _ from "lodash";

const minorWords = [
    // from APA style guide https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case
    'and', 'as', 'but', 'for', 'if', 'nor', 'or', 'so', 'yet',
    'a', 'an', 'the',
    'as', 'at', 'by', 'for', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via',
    // extras that I added
    'with', 'without', 'minus', 'plus'

]

/**
 * @param name The original user-given named
 * @returns a formatted string with start case except for minor words and numbers.
 * ex:
 *  "bowl of fried rice 100g" => "Bowl of Fried Rice 100g"
 */
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
                // if starting with numeric, such as 50mL (dont do 50Ml or 50ML)
                return part;
            }
            const [firstChar, ...rest] = part;
            // uppercase first letter then lowercase the rest.
            return `${firstChar.toLocaleUpperCase()}${rest.join('').toLocaleLowerCase()}`;
        }).join(' ');
}