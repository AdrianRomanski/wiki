import { MarkdownPort, ValidationResult } from '@wiki/application-ports';
import { Section } from '@wiki/domain-models';

export class MarkdownAdapter implements MarkdownPort {
  parseMarkdownSections(content: string): Section[] {
    const lines = content.split('\n');
    const sections: Section[] = [];
    const sectionStack: { section: Section; level: number }[] = [];
    
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        if (sectionStack.length > 0) {
          sectionStack[sectionStack.length - 1].section.content = currentContent.join('\n').trim();
          currentContent = [];
        }
        
        const level = headingMatch[1].length;
        const heading = headingMatch[2].trim();
        
        const newSection: Section = {
          heading,
          level,
          content: '',
          subsections: []
        };
        
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
          sectionStack.pop();
        }
        
        if (sectionStack.length > 0) {
          sectionStack[sectionStack.length - 1].section.subsections.push(newSection);
        } else {
          sections.push(newSection);
        }
        
        sectionStack.push({ section: newSection, level });
      } else {
        currentContent.push(line);
      }
    }
    
    if (sectionStack.length > 0) {
      sectionStack[sectionStack.length - 1].section.content = currentContent.join('\n').trim();
    }
    
    return sections;
  }

  extractWikiLinks(content: string): string[] {
    const wikiLinkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
    const links: Set<string> = new Set();
    
    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const linkTarget = match[1].trim();
      links.add(linkTarget);
    }
    
    return Array.from(links);
  }

  generateWikiLink(
    target: string,
    displayText?: string,
    section?: string
  ): string {
    let link = `[[${target}`;
    
    if (section) {
      link += `#${section}`;
    }
    
    if (displayText) {
      link += `|${displayText}`;
    }
    
    link += ']]';
    
    return link;
  }

  generateHeading(text: string, level: number): string {
    const clampedLevel = Math.max(1, Math.min(6, level));
    return `${'#'.repeat(clampedLevel)} ${text}`;
  }

  generateList(
    items: string[],
    ordered = false,
    indent = 0
  ): string {
    const indentation = '  '.repeat(indent);
    
    return items
      .map((item, index) => {
        const marker = ordered ? `${index + 1}.` : '-';
        return `${indentation}${marker} ${item}`;
      })
      .join('\n');
  }

  generateCodeBlock(code: string, language?: string): string {
    const lang = language || '';
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  }

  generateBlockquote(text: string): string {
    return text
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
  }

  generateTable(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `|${headers.map(() => '------').join('|')}|`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
    
    return `${headerRow}\n${separatorRow}\n${dataRows}`;
  }

  validateMarkdownSyntax(content: string): ValidationResult {
    const issues: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      const headingMatch = line.match(/^(#{7,})\s/);
      if (headingMatch) {
        issues.push(`Line ${lineNum}: Invalid heading level: ${headingMatch[1].length}`);
      }
      
      const unclosedLink = line.match(/\[\[[^\]]*$/);
      if (unclosedLink) {
        issues.push(`Line ${lineNum}: Unclosed wiki link`);
      }
      
      const codeBlockMarkers = line.match(/```/g);
      if (codeBlockMarkers && codeBlockMarkers.length > 1) {
        issues.push(`Line ${lineNum}: Multiple code block markers on same line`);
      }
    }
    
    const codeBlockCount = (content.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      issues.push('Unclosed code block detected');
    }
    
    return {
      valid: issues.length === 0,
      error: issues.length > 0 ? issues.join('; ') : undefined
    };
  }

  escapeMarkdown(text: string): string {
    const specialChars = /([\\`*_{}[\]()#+\-.!|])/g;
    return text.replace(specialChars, '\\$1');
  }

  sectionsToMarkdown(sections: Section[]): string {
    const parts: string[] = [];
    
    const processSections = (secs: Section[]) => {
      for (const section of secs) {
        parts.push(this.generateHeading(section.heading, section.level));
        
        if (section.content) {
          parts.push('');
          parts.push(section.content);
        }
        
        if (section.subsections.length > 0) {
          parts.push('');
          processSections(section.subsections);
        }
      }
    };
    
    processSections(sections);
    
    return parts.join('\n');
  }
}
