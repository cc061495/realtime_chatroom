import { Component, ErrorInfo } from 'react';

interface Props {
  youtubeId: string;
}

interface State {
  hasError: boolean;
  isLoaded: boolean;
}

class YouTubeEmbed extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isLoaded: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, isLoaded: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('YouTube embed error:', error, errorInfo);
  }

  private getEmbedUrl(): string {
    const params = new URLSearchParams({
      enablejsapi: '0',
      controls: '1',
      disablekb: '1',
      rel: '0',
      modestbranding: '1',
      nocookie: '1',
      autoplay: '0',
      iv_load_policy: '3', // Disable video annotations
      widget_referrer: 'none',
      playsinline: '1'
    });

    return `https://www.youtube-nocookie.com/embed/${this.props.youtubeId}?${params.toString()}`;
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mt-2 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          Video embed unavailable
        </div>
      );
    }

    return (
      <div className="mt-2 max-w-[500px]">
        <div className="relative aspect-video">
          <iframe
            src={this.getEmbedUrl()}
            title="YouTube video player"
            loading="lazy"
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="no-referrer"
            onLoad={() => this.setState({ isLoaded: true })}
            style={{
              border: 'none',
              pointerEvents: this.state.isLoaded ? 'auto' : 'none'
            }}
          />
        </div>
      </div>
    );
  }
}

export default YouTubeEmbed; 