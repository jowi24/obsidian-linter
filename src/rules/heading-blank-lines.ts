import {ignoreListOfTypes, IgnoreTypes} from '../utils/ignore-types';
import {Options, RuleType} from '../rules';
import RuleBuilder, {BooleanOptionBuilder, ExampleBuilder, OptionBuilderBase} from './rule-builder';
import dedent from 'ts-dedent';
import {yamlRegex} from '../utils/regex';

class HeadingBlankLinesOptions implements Options {
  bottom: boolean = true;
  emptyLineAfterYaml: boolean = true;
  emptyLineInBlankSections: boolean = true;
}

@RuleBuilder.register
export default class HeadingBlankLines extends RuleBuilder<HeadingBlankLinesOptions> {
  get OptionsClass(): new () => HeadingBlankLinesOptions {
    return HeadingBlankLinesOptions;
  }
  get name(): string {
    return 'Heading blank lines';
  }
  get description(): string {
    return 'All headings have a blank line both before and after (except where the heading is at the beginning or end of the document).';
  }
  get type(): RuleType {
    return RuleType.SPACING;
  }
  apply(text: string, options: HeadingBlankLinesOptions): string {
    return ignoreListOfTypes([IgnoreTypes.code, IgnoreTypes.yaml, IgnoreTypes.link, IgnoreTypes.wikiLink, IgnoreTypes.tag], text, (text) => {
      if (!options.bottom) {
        text = text.replace(/(^#+\s.*)\n+/gm, '$1\n'); // trim blank lines after headings
        text = text.replace(/\n+(#+\s.*)/g, '\n\n$1'); // trim blank lines before headings
      } else {
        text = text.replace(/^(#+\s.*)/gm, '\n\n$1\n\n'); // add blank line before and after headings
        text = text.replace(/\n+(#+\s.*)/g, '\n\n$1'); // trim blank lines before headings
        text = text.replace(/(^#+\s.*)\n+/gm, '$1\n\n'); // trim blank lines after headings
      }
      if (!options.emptyLineInBlankSections) {
        while (text.match(/(#+\s.*)\n\n+(#+\s.*)/gm)) {
          text = text.replace(/(#+\s.*)\n\n+(#+\s.*)/gm, '$1\n$2'); // remove blank lines between two immediate headings without text
        }
      }
      text = text.replace(/^\n+(#+\s.*)/, '$1'); // remove blank lines before first heading
      text = text.replace(/(#+\s.*)\n+$/, '$1'); // remove blank lines after last heading

      if (!options.emptyLineAfterYaml) {
        text = text.replace(new RegExp('(' + yamlRegex.source + ')\\n+(#+\\s.*)'), '$1\n$5');
      }

      return text;
    });
  }
  get exampleBuilders(): ExampleBuilder<HeadingBlankLinesOptions>[] {
    return [
      new ExampleBuilder({
        description: 'Headings should be surrounded by blank lines',
        before: dedent`
          # H1
          ## H2
          ${''}
          ${''}
          # H1
          line
          ## H2
          ${''}
        `,
        after: dedent`
          # H1
          ${''}
          ## H2
          ${''}
          # H1
          ${''}
          line
          ${''}
          ## H2
        `,
      }),
      new ExampleBuilder({
        description: 'With `Bottom=false`',
        before: dedent`
          # H1
          line
          ## H2
          # H1
          line
        `,
        after: dedent`
          # H1
          line
          ${''}
          ## H2
          ${''}
          # H1
          line
        `,
        options: {
          bottom: false,
          emptyLineAfterYaml: true,
          emptyLineInBlankSections: true,
        },
      }),
      new ExampleBuilder({
        description: 'With `Bottom=true`, `emptyLineInBlankSections=false`',
        before: dedent`
          # H1
          line
          ## H2
          # H1
          line
        `,
        after: dedent`
          # H1
          ${''}
          line
          ${''}
          ## H2
          # H1
          ${''}
          line
        `,
        options: {
          bottom: true,
          emptyLineAfterYaml: true,
          emptyLineInBlankSections: false,
        },
      }),
      new ExampleBuilder({
        description: 'With `Bottom=false`, `emptyLineInBlankSections=false`',
        before: dedent`
          # H1
          line
          ## H2
          # H1
          line
        `,
        after: dedent`
          # H1
          line
          ${''}
          ## H2
          # H1
          line
        `,
        options: {
          bottom: false,
          emptyLineAfterYaml: true,
          emptyLineInBlankSections: false,
        },
      }),
      new ExampleBuilder({
        description: 'With `Bottom=false`, `emptyLineInBlankSections=false`, multiple empty sections',
        before: dedent`
          # H1
          line
          ## H2
          ## H2
          # H1
          line
        `,
        after: dedent`
          # H1
          line
          ${''}
          ## H2
          ## H2
          # H1
          line
        `,
        options: {
          bottom: false,
          emptyLineAfterYaml: true,
          emptyLineInBlankSections: false,
        },
      }),
      new ExampleBuilder({
        // accounts for https://github.com/platers/obsidian-linter/issues/219
        description: 'Empty line before header and after Yaml is removed with `Empty Line Between Yaml and Header=true`',
        before: dedent`
          ---
          key: value
          ---
          # Header
          Paragraph here...
        `,
        after: dedent`
          ---
          key: value
          ---
          # Header

          Paragraph here...
        `,
        options: {
          bottom: true,
          emptyLineAfterYaml: false,
          emptyLineInBlankSections: true,
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<HeadingBlankLinesOptions>[] {
    return [
      new BooleanOptionBuilder({
        OptionsClass: HeadingBlankLinesOptions,
        name: 'Bottom',
        description: 'Insert a blank line after headings',
        optionsKey: 'bottom',
      }),
      new BooleanOptionBuilder({
        OptionsClass: HeadingBlankLinesOptions,
        name: 'Empty Line Between Yaml and Header',
        description: 'Keep the empty line between the Yaml frontmatter and header',
        optionsKey: 'emptyLineAfterYaml',
      }),
      new BooleanOptionBuilder({
        OptionsClass: HeadingBlankLinesOptions,
        name: 'Empty Line in Empty Sections',
        description: 'Keep the empty line in empty sections',
        optionsKey: 'emptyLineInBlankSections',
      }),
    ];
  }
}
